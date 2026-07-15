#!/usr/bin/env bash
set -Eeuo pipefail

image=${1:-shortener-demo:local}
container=shortener-demo-smoke
port=10000
jwt_secret=test-jwt-secret-key-for-demo-smoke-minimum-32-characters

cleanup() {
  docker rm --force --volumes "$container" >/dev/null 2>&1 || true
}

trap cleanup EXIT
cleanup

start_container() {
  docker run --detach \
    --name "$container" \
    --memory 512m \
    --publish "127.0.0.1:${port}:${port}" \
    --env PORT="$port" \
    --env JWT_SECRET="$jwt_secret" \
    "$image" >/dev/null
}

wait_for_health() {
  for attempt in $(seq 1 180); do
    if curl --fail --silent "http://127.0.0.1:${port}/health" >/dev/null; then
      return
    fi
    if [ "$attempt" -eq 180 ]; then
      docker logs "$container"
      echo "Demo container did not become healthy" >&2
      exit 1
    fi
    sleep 1
  done
}

start_container
wait_for_health

test "$(docker exec "$container" node --version | cut -d. -f1)" = "v24"
docker exec "$container" grep -q 'VERSION_CODENAME=bookworm' /etc/os-release
postgres_version=$(docker exec "$container" postgres --version 2>&1)
test "${postgres_version%%.*}" = 'postgres (PostgreSQL) 16'
test "$(docker exec "$container" redis-server --version | sed -n 's/.*v=\([0-9]*\).*/\1/p')" = '7'
test "$(docker exec "$container" cat /proc/1/comm)" = "s6-svscan"

docker exec "$container" sh -eu -c '
  assert_process_user() {
    process_name=$1
    expected_user=$2
    expected_uid=$(id -u "$expected_user")
    found=false
    for status in /proc/[0-9]*/status; do
      if [ "$(sed -n "s/^Name:[[:space:]]*//p" "$status")" = "$process_name" ]; then
        actual_uid=$(sed -n "s/^Uid:[[:space:]]*\([0-9]*\).*/\1/p" "$status")
        if [ "$actual_uid" = "$expected_uid" ]; then
          found=true
          break
        fi
      fi
    done
    "$found"
  }

  assert_process_user postgres postgres
  assert_process_user redis-server redis
  assert_process_user MainThread node
'

test "$(docker exec "$container" psql --host=127.0.0.1 --username=shortener --dbname=shortener --tuples-only --no-align --command='SHOW listen_addresses')" = "127.0.0.1"
test "$(docker exec "$container" redis-cli --raw CONFIG GET bind | tail -n 1)" = "127.0.0.1"

curl --fail --silent "http://127.0.0.1:${port}/" | grep --ignore-case '<!doctype html>' >/dev/null

token=$(curl --fail --silent \
  --header 'content-type: application/json' \
  --data '{"email":"demo-smoke@example.com","password":"Password123"}' \
  "http://127.0.0.1:${port}/register" | jq --raw-output '.token')
test -n "$token"
test "$token" != "null"

shorten_url=$(curl --fail --silent \
  --header 'content-type: application/json' \
  --header "authorization: Bearer $token" \
  --data '{"originalUrl":"https://example.com/demo-smoke"}' \
  "http://127.0.0.1:${port}/links" | jq --raw-output '.shortenUrl')
shorten_key=${shorten_url##*/}
test -n "$shorten_key"
test "$(curl --silent --output /dev/null --write-out '%{http_code}' "http://127.0.0.1:${port}/${shorten_key}")" = "302"

docker stop --time 30 "$container" >/dev/null
test "$(docker inspect --format '{{.State.ExitCode}}' "$container")" = "0"
shutdown_logs=$(docker logs "$container" 2>&1)
grep -q 'Graceful shutdown completed' <<<"$shutdown_logs"
docker rm --volumes "$container" >/dev/null

start_container
wait_for_health
test "$(curl --silent --output /dev/null --write-out '%{http_code}' "http://127.0.0.1:${port}/${shorten_key}")" = "404"

import { Link } from "react-router-dom";

import { useAuth } from "../hooks";

export function Nav () {
  const { isAuthenticated, logout } = useAuth()

  return (
    <nav className="fixed top-0 left-0 w-full p-4 flex justify-between items-center">
      <ul>
        <li>
          <Link to="/">🔗</Link>
        </li>
      </ul>

      <ul>
        {isAuthenticated
          ? (
            <li>
              <button onClick={logout}>logout</button>
            </li>
            )
          : (
            <li>
              <Link to="/login">🔑</Link>
            </li>
            )}
      </ul>
    </nav>
  )
}

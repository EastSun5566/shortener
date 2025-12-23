import type { FastifyReply, FastifyRequest } from 'fastify'
import { hash, compare } from 'bcryptjs'

import {
  createUser,
  findUserByEmail,
  signToken
} from '../services'
import { isValidEmail } from '../utils'

export async function handleRegister (
  request: FastifyRequest<{ Body: { email: string, password: string } }>,
  reply: FastifyReply
) {
  const { email, password } = request.body

  // 1. validate email and password
  if (!email || !isValidEmail(email) || !password) {
    reply.badRequest('Email or password is invalid')
    return
  }

  // 2. check if email is already registered
  const user = await findUserByEmail(email)
  if (user) {
    reply.badRequest('Email is already registered')
    return
  }

  // 3. hash password
  const saltRounds = 10
  const hashedPassword = await hash(password, saltRounds)

  // 4. save user to database
  const { id } = await createUser(email, hashedPassword)

  // 5. generate JWT
  const token = signToken({ email, id })

  reply.send({ token })
}

export async function handleLogin (
  request: FastifyRequest<{ Body: { email: string, password: string } }>,
  reply: FastifyReply
) {
  const { email, password } = request.body

  // 1. validate email and password
  if (!email || !isValidEmail(email) || !password) {
    reply.badRequest('Email or password is invalid')
    return
  }

  // 2. check if email is exists
  const user = await findUserByEmail(email)
  if (!user) {
    reply.badRequest('Email is not registered')
    return
  }

  // 3. compare password
  const isPasswordCorrect = await compare(password, user.password)
  if (!isPasswordCorrect) {
    reply.unauthorized('Unauthorized')
    return
  }

  // 4. generate JWT
  const token = signToken({ email, id: user.id })

  reply.send({ token })
}

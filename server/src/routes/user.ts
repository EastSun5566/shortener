import { Hono } from 'hono'
import { handleLogin, handleRegister } from '../controllers/index.js'

const app = new Hono()

app.post('/register', handleRegister)
app.post('/login', handleLogin)

export const userRoute = app
export default app

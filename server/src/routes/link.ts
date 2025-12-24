import { Hono } from 'hono'
import {
  handleRedirect,
  handleCreateLink,
  handleListLinks
} from '../controllers/index.js'

const app = new Hono()

app.get('/links', handleListLinks)
app.post('/links', handleCreateLink)
app.get('/:shortenKey', handleRedirect)

export const linkRoute = app
export default app

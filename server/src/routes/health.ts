import { Hono } from 'hono'
import { checkCacheHealth } from '../services/cache.js'
import { checkDbHealth } from '../drizzle/db.js'

export const healthRoute = new Hono()
  .get('/', (ctx) => ctx.text('OK'))
  .get('/health', async (ctx) => {
    const checks = {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
      cache: 'unknown' as 'healthy' | 'unhealthy' | 'unknown'
    }

    // Check database connection
    try {
      const isHealthy = await checkDbHealth()
      checks.database = isHealthy ? 'healthy' : 'unhealthy'
    } catch (error) {
      checks.database = 'unhealthy'
      console.error('Database health check failed:', error)
    }

    // Check Redis connection
    try {
      const isHealthy = await checkCacheHealth()
      checks.cache = isHealthy ? 'healthy' : 'unhealthy'
    } catch (error) {
      checks.cache = 'unhealthy'
      console.error('Cache health check failed:', error)
    }

    const isHealthy = checks.database === 'healthy' && checks.cache === 'healthy'
    const status = isHealthy ? 200 : 503

    return ctx.json({
      status: isHealthy ? 'ok' : 'degraded',
      checks
    }, status)
  })

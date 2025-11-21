import { PoolConfig } from 'pg'

export type ParsedDatabaseUrl = {
  connectionString: string
  host?: string
  port?: number
  database: string
  username?: string
  password?: string
  socketPath?: string
  params: Record<string, string>
  sslMode?: string
}

export const parseDatabaseUrl = (connectionString: string): ParsedDatabaseUrl => {
  const url = new URL(connectionString)
  const database = url.pathname.replace(/^\//, '')
  const username = url.username ? decodeURIComponent(url.username) : undefined
  const password = url.password ? decodeURIComponent(url.password) : undefined
  const hostParam = url.searchParams.get('host') ?? undefined
  const socketPath = hostParam && hostParam.startsWith('/') ? hostParam : undefined
  const host = socketPath ? undefined : (url.hostname || undefined)
  const port = url.port ? Number(url.port) : undefined
  const params: Record<string, string> = {}

  url.searchParams.forEach((value, key) => {
    params[key] = value
  })
  const sslMode = params.sslmode ?? process.env.PGSSLMODE ?? undefined

  return {
    connectionString,
    host,
    port,
    database,
    username,
    password,
    socketPath,
    params,
    sslMode,
  }
}

const shouldRejectUnauthorized = () => process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'

const normalizeSslMode = (mode?: string): string => (mode ?? '').toLowerCase()

export const resolveSslConfig = (parsed: ParsedDatabaseUrl): PoolConfig['ssl'] => {
  if (parsed.socketPath) {
    return false
  }

  const normalized = normalizeSslMode(parsed.sslMode)
  const rejectUnauthorized = shouldRejectUnauthorized()

  switch (normalized) {
    case '':
    case 'allow':
    case 'prefer':
      return process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized }
        : false
    case 'disable':
      return false
    case 'require':
    case 'verify-ca':
    case 'verify-full':
      return { rejectUnauthorized }
    default:
      return { rejectUnauthorized }
  }
}

// Database configuration for different environments
export const getDatabaseConfig = (): PoolConfig => {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  const parsed = parseDatabaseUrl(connectionString)
  const defaultPort = parsed.port ?? Number(process.env.DB_PORT || '5432')
  const sslConfig = resolveSslConfig(parsed)

  // Base configuration
  const baseConfig: PoolConfig = {
    user: parsed.username,
    password: parsed.password,
    database: parsed.database,
    host: parsed.socketPath ?? parsed.host ?? 'localhost',
    port: parsed.socketPath ? defaultPort : parsed.port ?? defaultPort,
    ssl: sslConfig,
  }

  // Environment-specific overrides
  const envConfig: Partial<PoolConfig> = {}

  if (process.env.NODE_ENV === 'production') {
    envConfig.max = parseInt(process.env.DB_POOL_MAX || '50') // Higher for production
    envConfig.min = parseInt(process.env.DB_POOL_MIN || '5')  // Keep more connections alive
    envConfig.idleTimeoutMillis = parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '60000') // 1 minute
    envConfig.connectionTimeoutMillis = parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '30000') // 30 seconds
  } else if (process.env.NODE_ENV === 'test') {
    envConfig.max = parseInt(process.env.DB_POOL_MAX || '5')  // Lower for tests
    envConfig.min = parseInt(process.env.DB_POOL_MIN || '1')  // Minimal connections
    envConfig.idleTimeoutMillis = parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '10000') // 10 seconds
    envConfig.connectionTimeoutMillis = parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '15000') // 15 seconds
  } else {
    // Development defaults
    envConfig.max = parseInt(process.env.DB_POOL_MAX || '20')
    envConfig.min = parseInt(process.env.DB_POOL_MIN || '2')
    envConfig.idleTimeoutMillis = parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000') // 30 seconds
    envConfig.connectionTimeoutMillis = parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '20000') // 20 seconds
  }

  return { ...baseConfig, ...envConfig }
}

// Connection pool monitoring utilities
export const logPoolStats = (pool: any) => {
  const stats = {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  }

  console.log('Database Pool Stats:', stats)
  return stats
}

// Health check query for connection validation
export const HEALTH_CHECK_QUERY = 'SELECT 1 as health_check'

// Connection retry configuration for Cloud Run environment
export const RETRY_CONFIG = {
  maxRetries: parseInt(process.env.DB_RETRY_MAX || '5'),
  retryDelay: parseInt(process.env.DB_RETRY_DELAY || '2000'), // milliseconds
  retryBackoff: parseFloat(process.env.DB_RETRY_BACKOFF || '2'), // exponential backoff multiplier
}

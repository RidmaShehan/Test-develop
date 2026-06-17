type LogMeta = Record<string, unknown>

const isProduction = process.env.NODE_ENV === 'production'

function log(level: 'info' | 'warn' | 'error', message: string, meta?: LogMeta) {
  const timestamp = new Date().toISOString()

  if (isProduction) {
    console.log(
      JSON.stringify({
        level,
        message,
        timestamp,
        ...meta,
      })
    )
  } else {
    const formattedMeta = meta ? ` ${JSON.stringify(meta)}` : ''
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    if (level === 'error') {
      console.error(`${prefix} ${message}${formattedMeta}`)
    } else if (level === 'warn') {
      console.warn(`${prefix} ${message}${formattedMeta}`)
    } else {
      console.log(`${prefix} ${message}${formattedMeta}`)
    }
  }
}

export const logger = {
  info(msg: string, meta?: LogMeta) {
    log('info', msg, meta)
  },
  warn(msg: string, meta?: LogMeta) {
    log('warn', msg, meta)
  },
  error(msg: string, meta?: LogMeta) {
    log('error', msg, meta)
  },
}

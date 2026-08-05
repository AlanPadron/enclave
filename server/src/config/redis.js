// Redis stub. Wire ioredis here when REDIS_URL is set.
export async function connectRedis() {
  if (process.env.REDIS_URL) {
    // const Redis = (await import('ioredis')).default
    // return new Redis(process.env.REDIS_URL)
    console.log('[redis] REDIS_URL provided — wire ioredis here')
  } else {
    console.log('[redis] no REDIS_URL, pub/sub is in-process')
  }
  return null
}

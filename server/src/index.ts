import { createWorker } from 'mediasoup'
import { createApp } from './app.js'

const PORT = parseInt(process.env.PORT || '4000', 10)
const NUM_WORKERS = parseInt(process.env.NUM_WORKERS || '1', 10)

async function main() {
  const workers = await Promise.all(
    Array.from({ length: NUM_WORKERS }, () => createWorker({
      logLevel: 'warn',
      rtcMinPort: 40000,
      rtcMaxPort: 49999,
    }))
  )

  console.log(`Started ${workers.length} mediasoup worker(s)`)

  let workerIndex = 0
  const getWorker = () => {
    const worker = workers[workerIndex % workers.length]
    workerIndex++
    return worker
  }

  const app = createApp(getWorker)
  app.listen(PORT, (token) => {
    if (token) {
      console.log(`Server listening on port ${PORT}`)
    }
  })
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})

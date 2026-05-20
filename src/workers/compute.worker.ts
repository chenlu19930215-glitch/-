import { runFullOptimization } from '../engine/optimizer'
import type { OptimizerInput, OptimizerConfig } from '../engine/types'

interface WorkerMessage {
  input: OptimizerInput
  config?: OptimizerConfig
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { input, config } = e.data
  const solutions = runFullOptimization(input, config)
  self.postMessage({ solutions })
}

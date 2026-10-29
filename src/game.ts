export const BOARD_SIZE = 20

export type Point = { x: number; y: number }
export type Direction = 'up' | 'down' | 'left' | 'right'
export type GameStatus = 'ready' | 'running' | 'paused' | 'over'

export interface GameState {
  snake: Point[]
  direction: Direction
  food: Point | null
  score: number
  status: GameStatus
  tick: number
}

const vectors: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export function createGame(random: () => number = Math.random): GameState {
  const snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }]
  return {
    snake,
    direction: 'right',
    food: spawnFood(snake, random),
    score: 0,
    status: 'ready',
    tick: 0,
  }
}

export function spawnFood(snake: Point[], random: () => number = Math.random): Point | null {
  const freeCells: Point[] = []
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) freeCells.push({ x, y })
    }
  }
  if (freeCells.length === 0) return null
  return freeCells[Math.floor(random() * freeCells.length)] ?? freeCells[0]!
}

export function setDirection(state: GameState, direction: Direction): GameState {
  const opposite: Record<Direction, Direction> = {
    up: 'down', down: 'up', left: 'right', right: 'left',
  }
  if (opposite[state.direction] === direction || state.status === 'over') return state
  return { ...state, direction, status: state.status === 'ready' ? 'running' : state.status }
}

export function advanceGame(state: GameState, random: () => number = Math.random): GameState {
  if (state.status !== 'running') return state
  const vector = vectors[state.direction]
  const head = { x: state.snake[0]!.x + vector.x, y: state.snake[0]!.y + vector.y }
  const ateFood = state.food !== null && head.x === state.food.x && head.y === state.food.y
  const bodyToCheck = ateFood ? state.snake : state.snake.slice(0, -1)
  const hitWall = head.x < 0 || head.y < 0 || head.x >= BOARD_SIZE || head.y >= BOARD_SIZE
  const hitSelf = bodyToCheck.some((segment) => segment.x === head.x && segment.y === head.y)

  if (hitWall || hitSelf) return { ...state, status: 'over' }

  const snake = [head, ...(ateFood ? state.snake : state.snake.slice(0, -1))]
  const score = state.score + (ateFood ? 1 : 0)
  const food = ateFood ? spawnFood(snake, random) : state.food
  return {
    ...state,
    snake,
    food,
    score,
    tick: state.tick + 1,
    status: food === null ? 'over' : state.status,
  }
}

export function gameSpeed(score: number): number {
  return Math.max(72, 160 - Math.floor(score / 5) * 14)
}

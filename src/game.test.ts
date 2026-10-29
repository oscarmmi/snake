import { describe, expect, it } from 'vitest'
import { advanceGame, createGame, spawnFood, type GameState, type Point } from './game'

const running = (overrides: Partial<GameState> = {}): GameState => ({
  ...createGame(() => 0.5),
  status: 'running',
  ...overrides,
})

describe('snake game logic', () => {
  it('grows and increments score when the head eats food', () => {
    const state = running({
      snake: [{ x: 4, y: 5 }, { x: 3, y: 5 }, { x: 2, y: 5 }],
      direction: 'right',
      food: { x: 5, y: 5 },
    })

    const next = advanceGame(state, () => 0)

    expect(next.snake).toHaveLength(4)
    expect(next.snake[0]).toEqual({ x: 5, y: 5 })
    expect(next.score).toBe(1)
    expect(next.food).not.toBeNull()
  })

  it('ends the game when the snake moves through a wall', () => {
    const state = running({
      snake: [{ x: 19, y: 5 }, { x: 18, y: 5 }, { x: 17, y: 5 }],
      direction: 'right',
    })

    expect(advanceGame(state).status).toBe('over')
  })

  it('never spawns food on a snake cell', () => {
    const snake: Point[] = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]
    const food = spawnFood(snake, () => 0)

    expect(food).not.toBeNull()
    expect(snake).not.toContainEqual(food)
  })
})

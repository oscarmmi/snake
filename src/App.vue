<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { advanceGame, BOARD_SIZE, createGame, gameSpeed, setDirection, type Direction, type Point } from './game'

const game = ref(createGame())
const best = ref(0)
const board = ref<HTMLElement | null>(null)
const cells = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({
  x: index % BOARD_SIZE,
  y: Math.floor(index / BOARD_SIZE),
}))
let timer: ReturnType<typeof setInterval> | undefined
let swipeStart: Point | null = null

const scoreLabel = computed(() => String(game.value.score).padStart(2, '0'))
const bestLabel = computed(() => String(best.value).padStart(2, '0'))
const speedLabel = computed(() => `${Math.round(160 / gameSpeed(game.value.score) * 100)}%`)

function isSnake(point: Point) {
  return game.value.snake.some((segment) => segment.x === point.x && segment.y === point.y)
}

function isHead(point: Point) {
  return game.value.snake[0]?.x === point.x && game.value.snake[0]?.y === point.y
}

function isFood(point: Point) {
  return game.value.food?.x === point.x && game.value.food?.y === point.y
}

function start() {
  if (game.value.status === 'over') game.value = createGame()
  game.value = { ...game.value, status: 'running' }
}

function restart() {
  game.value = { ...createGame(), status: 'running' }
}

function togglePause() {
  if (game.value.status === 'ready') start()
  else if (game.value.status === 'running') game.value = { ...game.value, status: 'paused' }
  else if (game.value.status === 'paused') game.value = { ...game.value, status: 'running' }
  else restart()
}

function turn(direction: Direction) {
  game.value = setDirection(game.value, direction)
}

function onKeydown(event: KeyboardEvent) {
  const keyMap: Record<string, Direction> = {
    ArrowUp: 'up', w: 'up', W: 'up',
    ArrowDown: 'down', s: 'down', S: 'down',
    ArrowLeft: 'left', a: 'left', A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right',
  }
  const direction = keyMap[event.key]
  if (direction) {
    event.preventDefault()
    turn(direction)
  } else if (event.code === 'Space') {
    event.preventDefault()
    togglePause()
  } else if (event.key.toLowerCase() === 'r') restart()
}

function onPointerDown(event: PointerEvent) {
  swipeStart = { x: event.clientX, y: event.clientY }
}

function onPointerUp(event: PointerEvent) {
  if (!swipeStart) return
  const dx = event.clientX - swipeStart.x
  const dy = event.clientY - swipeStart.y
  swipeStart = null
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return
  turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'))
}

watch(() => game.value.score, (score) => {
  if (score <= best.value) return
  best.value = score
  localStorage.setItem('snake-best', String(score))
})

watch(() => [game.value.status, game.value.score] as const, ([status]) => {
  if (timer) clearInterval(timer)
  timer = undefined
  if (status === 'running') {
    timer = setInterval(() => { game.value = advanceGame(game.value) }, gameSpeed(game.value.score))
  }
})

onMounted(() => {
  best.value = Number(localStorage.getItem('snake-best') || 0)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <main class="page-shell">
    <header class="topbar">
      <a class="wordmark" href="#" aria-label="Snake home">
        <span class="wordmark-icon" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>after<span class="wordmark-accent">hours</span></span>
      </a>
      <div class="topbar-note"><span class="live-dot"></span> A LITTLE ARCADE BREAK</div>
      <a class="github-link" href="https://github.com/oscarmmi/snake" target="_blank" rel="noreferrer">
        SOURCE <span aria-hidden="true">↗</span>
      </a>
    </header>

    <section class="game-layout" aria-label="Snake arcade game">
      <div class="intro-column">
        <p class="eyebrow"><span>01</span> THE CLASSIC, REWIRED</p>
        <h1>One more<br /><span>run.</span></h1>
        <p class="intro-copy">A tiny test of timing, nerve, and knowing when to turn.</p>

        <div class="record-card">
          <div class="record-mark" aria-hidden="true">✳</div>
          <div>
            <span class="record-label">YOUR PERSONAL BEST</span>
            <strong>{{ bestLabel }}<small> bites</small></strong>
          </div>
          <span class="record-arrow" aria-hidden="true">↗</span>
        </div>

        <div class="how-to">
          <p class="eyebrow">HOW TO PLAY</p>
          <div class="instruction-row"><span class="key-cluster">↑ ↓ ← →</span><span>or WASD to steer</span></div>
          <div class="instruction-row"><span class="keycap">SPACE</span><span>pause the run</span></div>
          <div class="instruction-row"><span class="keycap">R</span><span>start over</span></div>
        </div>
      </div>

      <div class="cabinet-column">
        <div class="game-heading">
          <div class="game-title"><span class="status-light" :class="`is-${game.status}`"></span><div><span class="micro-label">ARCADE NO. 001</span><h2>Snake</h2></div></div>
          <div class="level-chip"><span class="level-spark">✳</span> LEVEL {{ Math.floor(game.score / 5) + 1 }}</div>
        </div>

        <div class="screen-frame">
          <div class="screen-topline"><span>● LIVE BOARD</span><span>{{ game.status === 'running' ? 'RUN IN PROGRESS' : game.status === 'paused' ? 'PAUSED' : game.status === 'over' ? 'RUN ENDED' : 'READY WHEN YOU ARE' }}</span></div>
          <div
            ref="board"
            class="board"
            :class="{ 'board-running': game.status === 'running' }"
            role="img"
            aria-label="Snake game board. Swipe to steer."
            @pointerdown="onPointerDown"
            @pointerup="onPointerUp"
            @pointercancel="swipeStart = null"
          >
            <div v-for="cell in cells" :key="`${cell.x}-${cell.y}`" class="cell" :class="{
              'cell-snake': isSnake(cell), 'cell-head': isHead(cell), 'cell-food': isFood(cell),
            }">
              <span v-if="isHead(cell)" class="head-eyes" aria-hidden="true"><i></i><i></i></span>
            </div>
            <div v-if="game.status !== 'running'" class="board-overlay">
              <div class="overlay-orbit" aria-hidden="true"><span>✳</span></div>
              <p class="overlay-kicker">{{ game.status === 'paused' ? 'TAKE YOUR TIME' : game.status === 'over' ? 'THAT’S A WRAP' : 'READY, PLAYER ONE?' }}</p>
              <h3>{{ game.status === 'paused' ? 'Paused.' : game.status === 'over' ? 'Nice run.' : 'Find your flow.' }}</h3>
              <p class="overlay-copy">{{ game.status === 'over' ? `You collected ${game.score} ${game.score === 1 ? 'bite' : 'bites'}. Go again?` : 'Collect the amber. Avoid the edges.' }}</p>
              <button class="start-button" @click="game.status === 'paused' ? togglePause() : start()">
                <span>{{ game.status === 'paused' ? 'RESUME RUN' : game.status === 'over' ? 'PLAY AGAIN' : 'START GAME' }}</span><span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
          <div class="screen-footer"><span><i class="legend-snake"></i> YOU</span><span><i class="legend-food"></i> SNACK</span><span class="swipe-hint">SWIPE TO STEER</span></div>
        </div>

        <div class="hud-row">
          <div class="hud-stat score-stat"><span class="hud-label">SCORE</span><strong>{{ scoreLabel }}</strong><span class="hud-unit">BITES</span></div>
          <div class="hud-stat"><span class="hud-label">BEST</span><strong>{{ bestLabel }}</strong><span class="hud-unit">ALL TIME</span></div>
          <div class="hud-stat speed-stat"><span class="hud-label">PACE</span><strong>{{ speedLabel }}</strong><span class="hud-unit">AND CLIMBING</span></div>
          <button class="icon-button pause-button" :aria-label="game.status === 'paused' ? 'Resume game' : 'Pause game'" @click="togglePause">{{ game.status === 'running' ? 'Ⅱ' : '▶' }}</button>
        </div>

        <div class="mobile-controls" aria-label="Directional controls">
          <button class="dpad-up" aria-label="Move up" @pointerdown.prevent="turn('up')">↑</button>
          <button class="dpad-left" aria-label="Move left" @pointerdown.prevent="turn('left')">←</button>
          <button class="dpad-down" aria-label="Move down" @pointerdown.prevent="turn('down')">↓</button>
          <button class="dpad-right" aria-label="Move right" @pointerdown.prevent="turn('right')">→</button>
          <span>MOVE</span>
        </div>
        <p class="footnote">MADE FOR THE MOMENT BETWEEN MOMENTS <span>✳</span></p>
      </div>
    </section>
    <footer class="page-footer"><span>AFTERHOURS ARCADE</span><span>NO DOWNLOAD. JUST ONE MORE RUN.</span><span>© 2026</span></footer>
  </main>
</template>

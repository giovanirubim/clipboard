const cmp = (a, b) => {
	return a.cost - b.cost
}

const Item = (row, col, dir, cost) => {
	return { row, col, dir, cost }
}

const bubble_up = (h, i) => {
	const item = h[i]
	while (i > 0) {
		const p = (i - 1) >> 1
		if (cmp(h[p], item) <= 0) break
		h[i] = h[p]
		i = p
	}
	h[i] = item
}

const bubble_down = (h, i) => {
	const { length: n } = h
	const item = h[i]
	for (;;) {
		let c = (i << 1) | 1
		if (c >= n) break
		if (c + 1 < n && cmp(h[c + 1], h[c]) < 0) c += 1
		if (cmp(h[c], item) >= 0) break
		h[i] = h[c]
		i = c
	}
	h[i] = item
}

const heap_push = (h, item) => {
	h.push(item)
	bubble_up(h, h.length - 1)
}

const heap_pop = (h) => {
	const item = h[0]
	if (h.length > 1) {
		h[0] = h[h.length - 1]
		h.length -= 1
		bubble_down(h, 0)
	} else {
		h.length -= 1
	}
	return item
}

const inputName = process.argv[2] ?? './input.txt'

const input = require('fs')
	.readFileSync(inputName)
	.toString('utf8')
	.split('\n')
	.map((l) => l.trim())
	.filter((l) => l)
	.map((l) => l.split(''))

const rows = input.length
const cols = input[0].length

const UP = 0
const RIGHT = 1
const DOWN = 2
const LEFT = 3
const START = 'S'
const END = 'E'
const WALL = '#'

const costMap = {}

const calcTurningCost = (dir1, dir2) => {
	const diff = Math.abs(dir1 - dir2)
	return (diff === 3 ? 1 : diff) * 1000
}

const stateKey = (row, col, dir) => {
	return (row * cols + col) * 4 + dir
}

const costFor = (stateKey) => {
	return costMap[stateKey] ?? Infinity
}

const findStartEnd = () => {
	let start = null,
		end = null
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const cell = input[row][col]
			if (cell === START) {
				start = { row, col }
			} else if (cell === END) {
				end = { row, col }
			}
		}
	}
	return { start, end }
}

const dirs = [UP, RIGHT, DOWN, LEFT]

const addNeighbor = (h, row, col, dir, cost) => {
	if (row < 0 || col < 0 || row === rows || col === cols) return
	if (input[row][col] === WALL) return
	const key = stateKey(row, col, dir)
	if (cost >= costFor(key)) return
	costMap[key] = cost
	heap_push(h, Item(row, col, dir, cost))
}

const addNeighbors = (h, { row, col, dir, cost }) => {
	for (const prevDir of dirs) {
		if (prevDir === dir) continue
		addNeighbor(h, row, col, prevDir, cost + calcTurningCost(prevDir, dir))
	}
	switch (dir) {
		case UP:
			addNeighbor(h, row + 1, col, UP, cost + 1)
			break
		case RIGHT:
			addNeighbor(h, row, col - 1, RIGHT, cost + 1)
			break
		case DOWN:
			addNeighbor(h, row - 1, col, DOWN, cost + 1)
			break
		case LEFT:
			addNeighbor(h, row, col + 1, LEFT, cost + 1)
			break
	}
}

const main = () => {
	const { start, end } = findStartEnd()
	const { row, col } = end
	const h = dirs.map((dir) => Item(row, col, dir, 0))
	while (h.length) {
		const item = heap_pop(h)
		if (
			item.row === start.row &&
			item.col === start.col &&
			item.dir === LEFT
		) {
			console.log(item.cost)
			break
		}
		addNeighbors(h, item)
	}
}

const testHeap = () => {
	const n = 1e5
	const values = []
	const h = []
	for (let i = 0; i < n; ++i) {
		const cost = (Math.random() * n * 2) | 0
		values.push(cost)
		heap_push(h, { cost })
	}
	const sorted = values
		.slice()
		.sort((a, b) => a - b)
		.join(',')
	const popped = []
	while (h.length) {
		popped.push(heap_pop(h))
	}
	const match = popped.map((item) => item.cost).join(',') === sorted
	console.log(`Test result: ${match ? 'PASS' : 'FAIL'}`)
}

// testHeap()
main()

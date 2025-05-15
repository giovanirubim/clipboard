const cmp = (a, b) => a.cost - b.cost
const Item = (row, col, dir, cost) => ({ row, col, dir, cost })

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

const rows = input.length,
	cols = input[0].length,
	UP = 0,
	RIGHT = 1,
	DOWN = 2,
	LEFT = 3,
	START = 'S',
	END = 'E',
	WALL = '#',
	costMap = {}

const calcTurningCost = (prevDir, nextDir) => {
	const diff = Math.abs(nextDir - prevDir)
	return (diff === 3 ? 1 : diff) * 1000
}

const getCellKey = (row, col) => row * cols + col
const getStateKey = (row, col, dir) => getCellKey(row, col) * 4 + dir
const costFor = (stateKey) => costMap[stateKey] ?? Infinity
const fromStateKey = (stateKey) => {
	const dir = stateKey & 3
	stateKey >>= 2
	const col = stateKey % cols
	const row = (stateKey / cols) | 0
	return { row, col, dir }
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

const isValidCell = (row, col) => {
	return (
		row >= 0 &&
		row < rows &&
		col >= 0 &&
		col < cols &&
		input[row][col] !== WALL
	)
}

const addNeighbor = (h, row, col, dir, cost) => {
	if (!isValidCell(row, col)) return
	const key = getStateKey(row, col, dir)
	const currentCost = costFor(key)
	if (cost >= currentCost) return
	costMap[key] = cost
	heap_push(h, Item(row, col, dir, cost))
}

const addBackwardNeighbors = (h, { row, col, dir, cost }) => {
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

const getOptimalNeighbors = (row, col, dir) => {
	let bestCost = Infinity
	const res = []
	for (const nextDir of dirs) {
		if (nextDir === dir) continue
		const newCost =
			calcTurningCost(dir, nextDir) +
			costFor(getStateKey(row, col, nextDir))
		if (newCost > bestCost || newCost === Infinity) continue
		if (newCost < bestCost) {
			res.length = 0
		}
		res.push({ row, col, dir: nextDir })
		bestCost = newCost
	}
	if (dir === UP) row -= 1
	else if (dir === RIGHT) col += 1
	else if (dir === DOWN) row += 1
	else if (dir === LEFT) col -= 1
	if (isValidCell(row, col)) {
		const newCost = costFor(getStateKey(row, col, dir)) + 1
		if (newCost < bestCost) res.length = 0
		if (newCost <= bestCost) res.push({ row, col, dir })
	}
	return res
}

const countOptimalCells = (start) => {
	const visitedStates = new Set()
	const optimalCell = new Set()

	const stack = [{ ...start, dir: RIGHT }]
	optimalCell.add(getCellKey(start.row, start.col))

	while (stack.length) {
		const { row, col, dir } = stack.pop()
		const neighbors = getOptimalNeighbors(row, col, dir)
		for (const { row, col, dir } of neighbors) {
			optimalCell.add(getCellKey(row, col))
			const stateKey = getStateKey(row, col, dir)
			if (visitedStates.has(stateKey)) continue
			visitedStates.add(stateKey)
			stack.push({ row, col, dir })
		}
	}

	return optimalCell.size
}

const main = () => {
	const { start, end } = findStartEnd()
	const { row, col } = end
	const h = dirs.map((dir) => Item(row, col, dir, 0))
	for (const { row, col, dir } of h) {
		costMap[getStateKey(row, col, dir)] = 0
	}
	while (h.length) {
		const item = heap_pop(h)
		if (
			item.row === start.row &&
			item.col === start.col &&
			item.dir === RIGHT
		) {
			console.log('Minimum cost:', item.cost)
			break
		}
		addBackwardNeighbors(h, item)
	}
	console.log('Number of optimal cells:', countOptimalCells(start))
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

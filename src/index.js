import {
	emit,
	on,
	off,
	getCanvas,
	init,
	initKeys,
	load,
	GameLoop,
	Pool,
	Sprite,
	SpriteSheet,
	keyPressed
} from "kontra"

import throttle from "lodash/throttle"

const PLAYER_Y_VELOCITY = 1
const MAX_X_VELOCITY = 8
const PLAYER_HEIGHT = 68
const PLAYER_WIDTH = 64

const BRICK_SIZE = 64
const BRICK_VELOCITY = -2
const BRICKS_PER_ROW = 14

const COLLISION_THRESHOLD = 8

function createPlayer(playerSheet) {
	return Sprite({
		x: 100,
		y: 100,
		width: PLAYER_WIDTH,
		height: PLAYER_HEIGHT,
		dy: PLAYER_Y_VELOCITY,
		animations: playerSheet.animations,
		update() {
			if (keyPressed("left")) {
				this.playAnimation("left")
				if (this.dx > -MAX_X_VELOCITY) {
					this.dx -= 1
				}
			} else if (keyPressed("right")) {
				this.playAnimation("right")
				if (this.dx < MAX_X_VELOCITY) {
					this.dx += 1
				}
			} else {
				this.dx = 0
			}
			this.advance()
		}
	})
}

function createRowOfBricks(sheet, pool) {
	const canvas = getCanvas()
	let x = 0
	const y = canvas.height
	const mandatorySpace = Math.round(Math.random() * BRICKS_PER_ROW)
	let holesCount = 0
	const MAX_HOLES = 4
	for (let i = 0; i < BRICKS_PER_ROW; i++) {
		x = BRICK_SIZE * i
		if (
			holesCount >= MAX_HOLES ||
			(i !== mandatorySpace && Math.round(Math.random() * 4) > 0)
		) {
			pool.get({
				x,
				y,
				width: BRICK_SIZE,
				height: BRICK_SIZE,
				animations: sheet.animations,
				dy: BRICK_VELOCITY,
				isAlive() {
					return !(this.y + this.height < 0)
				}
			})
		} else {
			holesCount++
		}
	}
}

function checkPlayerBounds(canvas, player) {
	// left
	if (player.x < 0) {
		player.x = 0
	}
	// right
	else if (player.x > canvas.width - player.width) {
		player.x = canvas.width - player.width
	}

	// bottom
	if (player.y > canvas.height - player.height) {
		player.y = canvas.height - player.height
	}
	// top
	else if (player.y < 0) {
		emit("gameover")
	}
}

function checkCollisionBrick(player, brick) {
	const yDeltaTop = player.y + player.height - brick.y
	// player intersecting from top by maximum 8 pixels
	const xDeltaLeft = player.x + player.width - brick.x
	const xDeltaRight = player.x - brick.x - brick.width
	if (yDeltaTop >= 8 && player.y < brick.y + brick.height) {
		player.dy = PLAYER_Y_VELOCITY
		// left side of brick
		if (
			// right side of player > left side of brick
			player.x + player.width > brick.x &&
			// left side of player < left side of brick
			player.x < brick.x
		) {
			player.x = brick.x - player.width
			player.dx = 0
			player.ddx = 0
		}
		// right side of brick
		else if (
			// left side of player < right side of brick
			player.x < brick.x + brick.width &&
			// right side of player > right side of brick
			player.x + player.width > brick.x + brick.width
		) {
			player.x = brick.x + brick.width
			player.dx = 0
			player.ddx = 0
		}
	}
	// player on top of brick
	else if (
		yDeltaTop > 0 &&
		yDeltaTop < COLLISION_THRESHOLD &&
		// player.y - player.radius < brick.y + brick.height &&
		xDeltaLeft > COLLISION_THRESHOLD &&
		xDeltaRight < -COLLISION_THRESHOLD
	) {
		player.dy = brick.dy
		player.y = brick.y - player.height
	} else {
		player.dy = PLAYER_Y_VELOCITY
	}
}

function main() {
	const { canvas } = init()
	initKeys()
	let score = 0
	let level = 1
	load("assets/sprites/birds.png", "assets/sprites/bricks.png").then(
		([playerSprite, brickSprite]) => {
			let playerSheet = SpriteSheet({
				image: playerSprite,
				frameWidth: 16,
				frameHeight: 17,
				animations: {
					left: {
						frames: 0
					},
					right: {
						frames: 1
					}
				}
			})

			let brickSheet = SpriteSheet({
				image: brickSprite,
				frameWidth: 16,
				frameHeight: 16,
				animations: {
					one: {
						frames: 0
					},
					two: {
						frames: 1
					}
				}
			})

			let scoreText = Sprite({
				x: 20,
				y: 44,
				render() {
					this.context.font = "32px monospace"
					this.context.fillStyle = "white"
					this.context.fillText(score, this.x, this.y)
					this.context.strokeStyle = "black"
					this.context.strokeText(score, this.x, this.y)
				}
			})

			const brickPool = Pool({
				create: Sprite,
				maxSize: 70
			})

			const player = createPlayer(playerSheet)
			const throttledCreateRowOfBricks = throttle(() => {
				createRowOfBricks(brickSheet, brickPool)
				score += 100
			}, 1000)

			const loop = GameLoop({
				update() {
					brickPool.update()
					player.update()
					throttledCreateRowOfBricks()
					checkPlayerBounds(canvas, player)
					const bricks = brickPool.getAliveObjects()
					bricks.forEach(brick => {
						brick.update()
						checkCollisionBrick(player, brick)
					})
					scoreText.update()
				},
				render() {
					player.render()
					brickPool.getAliveObjects().forEach(brick => brick.render())
					scoreText.render()
				}
			})
			on("gameover", () => {
				loop.stop()
			})
			loop.start()
		}
	)
}

main()

import {
	emit,
	on,
	off,
	getCanvas,
	init,
	initKeys,
	load,
	GameLoop,
	Sprite,
	SpriteSheet,
	keyPressed
} from "kontra"

import throttle from "lodash/throttle"

const PLAYER_SPEED = 2
const MAX_ACCELERATION = 4
const MAX_VELOCITY = 6

const BRICK_SPEED = -3
const COLLISION_THRESHOLD = 8

function createPlayer(playerSheet) {
	return Sprite({
		x: 100,
		y: 100,
		width: 16 * 4,
		height: 17 * 4,
		dy: PLAYER_SPEED,
		animations: playerSheet.animations,
		update() {
			if (keyPressed("left")) {
				this.playAnimation("left")
				if (this.ddx > -MAX_ACCELERATION && this.dx > -MAX_VELOCITY) {
					if (this.dx > 0) {
						this.dx = 0
					}
					this.ddx = -0.5
				}
			} else if (keyPressed("right")) {
				this.playAnimation("right")
				if (this.ddx < MAX_ACCELERATION && this.dx < MAX_VELOCITY) {
					if (this.dx < 0) {
						this.dx = 0
					}
					this.ddx = 0.5
				}
			} else {
				if (this.dx > 0) {
					this.ddx = -0.1
				} else if (this.dx < 0) {
					this.ddx = 0.1
				}
			}
			this.advance()
		}
	})
}

function createBrick(brickSheet, x, y) {
	return Sprite({
		x,
		y,
		width: 16 * 4,
		height: 16 * 4,
		animations: brickSheet.animations,
		dy: BRICK_SPEED,
		update() {
			this.advance()
		}
	})
}

function createRowOfBricks(brickSheet) {
	const canvas = getCanvas()
	let x = 0
	const BRICK_SIZE = 64
	const y = canvas.height
	const bricks = []
	while (x + BRICK_SIZE < canvas.width) {
		if (Math.round(Math.random() * 2) > 0) {
			bricks.push(createBrick(brickSheet, x, y))
		}
		x += BRICK_SIZE
	}
	return bricks
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
		player.dy = PLAYER_SPEED
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
		player.dy = PLAYER_SPEED
	}
}

function main() {
	const { canvas } = init()
	initKeys()
	let bricks = []
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

			const player = createPlayer(playerSheet)
			const throttledCreateRowOfBricks = throttle(() => {
				bricks = bricks.concat(createRowOfBricks(brickSheet))
			}, 1000)

			const loop = GameLoop({
				update() {
					player.update()
					throttledCreateRowOfBricks()
					checkPlayerBounds(canvas, player)
					bricks.forEach(brick => {
						brick.update()
						checkCollisionBrick(player, brick)
					})
				},
				render() {
					player.render()
					bricks.forEach(sprite => sprite.render())
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

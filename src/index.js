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

const PLAYER_SPEED = 1

function createPlayer(playerSheet) {
	return Sprite({
		x: 100,
		y: 100,
		width: 16 * 4,
		height: 17 * 4,
		dy: PLAYER_SPEED,
		animations: playerSheet.animations,
		isFlipped: false,
		update() {
			if (keyPressed("left")) {
				this.playAnimation("left")
				if (this.ddx > -8 && this.dx > -8) {
					if (this.dx > 0) {
						this.dx = 0
					}
					this.ddx = -1
				}
			} else if (keyPressed("right")) {
				this.playAnimation("right")
				if (this.ddx < 8 && this.dx < 8) {
					if (this.dx < 0) {
						this.dx = 0
					}
					this.ddx = 1
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
		dy: -1,
		update() {
			this.advance()
		}
	})
}

function createRowOfBricks(brickSheet) {
	const canvas = getCanvas()
	let x = 0
	const BRICK_SIZE = 64
	const y = canvas.height - BRICK_SIZE
	const bricks = []
	while (x + BRICK_SIZE < canvas.width) {
		if (Math.round(Math.random() * 4) > 0) {
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
	// player on top of brick
	if (
		player.y + player.height === brick.y &&
		// player.y - player.radius < brick.y + brick.height &&
		player.x + player.width > brick.x &&
		player.x < brick.x + brick.width
	) {
		player.dy = brick.dy
	}

	// player not on top of brick
	else {
		player.dy = PLAYER_SPEED
	}

	// intersecting Y
	if (
		player.y + player.height > brick.y &&
		player.y < brick.y + brick.height
	) {
		// left side of brick
		if (
			// right side of player > left side of brick
			player.x + player.width > brick.x &&
			// left side of player < left side of brick
			player.x < brick.x
		) {
			console.log("left side brick collision")
			player.x = brick.x - player.width
		}
		// right side of brick
		else if (
			// left side of player < right side of brick
			player.x - player.width < brick.x + brick.width &&
			// right side of player > right side of brick
			player.x + player.width > brick.x + brick.width
		) {
			console.log("right side brick collision")
			player.x = brick.x + brick.width
		}
	}
}

function main() {
	const { canvas } = init()
	initKeys()
	let bricks = []
	load("/assets/sprites/birds.png", "/assets/sprites/bricks.png").then(
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
			bricks = bricks.concat(createRowOfBricks(brickSheet))
			const loop = GameLoop({
				update() {
					player.update()
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

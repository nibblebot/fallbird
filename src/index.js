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

function createBrick(brickSprite) {
	const canvas = getCanvas()
	return Sprite({
		x: 200,
		y: canvas.height - 100,
		// width: 100 + Math.random() * 700,
		// height: 40,
		image: brickSprite,
		dy: -1,
		render() {
			this.context.fillStyle = "green"
			this.context.fillRect(this.x, this.y, this.width, this.height)
		},
		update() {
			this.advance()
		}
	})
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
	else if (player.y - player.height < 0) {
		emit("gameover")
	}
}

function checkCollisionBrick(player, brick) {
	if (
		player.y + player.height === brick.y &&
		// player.y - player.radius < brick.y + brick.height &&
		player.x + player.width > brick.x &&
		player.x < brick.x + brick.width
	) {
		player.dy = brick.dy
	} else {
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
			player.x = brick.x - player.width
		}
		// right side of brick
		else if (
			// left side of player < right side of brick
			player.x - player.width < brick.x + brick.width &&
			// right side of player > right side of brick
			player.x + player.width > brick.x + brick.width
		) {
			player.x = brick.x + brick.width
		}
	}
}
function main() {
	const { canvas } = init()
	initKeys()
	const bricks = []
	load("/assets/sprites/birds.png", "/assets/sprites/bricks.png").then(
		([playerSprite, brickSprite]) => {
			let playerSheet = SpriteSheet({
				image: playerSprite,
				frameWidth: 16,
				frameHeight: 17,
				animations: {
					// create a named animation: walk
					left: {
						frames: 0
					},
					right: {
						frames: 1
					}
				}
			})

			const player = createPlayer(playerSheet)
			bricks.push(createBrick(brickSprite))
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

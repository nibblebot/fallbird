import { init, initKeys, GameLoop, Sprite, keyPressed, getCanvas } from "kontra"
init()
initKeys()
const sprites = []

const PLAYER_SPEED = 1

let player = Sprite({
	x: 100,
	y: 100,
	dy: PLAYER_SPEED,
	radius: 30,
	lineWidth: 4,
	render() {
		this.context.strokeStyle = "white"
		this.context.lineWidth = this.lineWidth

		this.context.beginPath() // start drawing a shape
		this.context.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
		this.context.stroke() // outline the circle
	},
	update() {
		if (keyPressed("left")) {
			if (this.ddx > -8 && this.dx > -8) {
				if (this.dx > 0) {
					this.dx = 0
				}
				this.ddx = -1
			}
		} else if (keyPressed("right")) {
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
sprites.push(player)

let brick = Sprite({
	x: 0,
	y: 400,
	width: 800,
	height: 40,
	dy: -1,
	render() {
		this.context.fillStyle = "green"
		this.context.fillRect(this.x, this.y, this.width, this.height)
	},
	update() {
		this.advance()
	}
})
sprites.push(brick)

function checkPlayerBounds(canvas) {
	if (player.x - player.radius < 0) {
		player.x = player.radius
	} else if (player.x > canvas.width - player.radius) {
		player.x = canvas.width - player.radius
	}
	if (player.y > canvas.height - player.radius) {
		player.y = canvas.height - player.radius
	} else if (player.y - player.radius < 0) {
		console.log("game over")
		loop.stop()
	}
}

const loop = GameLoop({
	update() {
		const canvas = getCanvas()
		player.update()
		brick.update()

		checkPlayerBounds(canvas)
		if (
			player.y + player.radius + player.lineWidth > brick.y &&
			player.y - player.radius < brick.y + brick.height &&
			player.x + player.radius > brick.x &&
			player.x - player.radius < brick.x + brick.width
		) {
			player.dy = brick.dy
		} else {
			player.dy = PLAYER_SPEED
		}
	},
	render() {
		sprites.forEach(sprite => sprite.render())
	}
})

loop.start()

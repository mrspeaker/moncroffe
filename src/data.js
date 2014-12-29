"use strict";

var data = {

	init: function () {
		var world = this.world,
			chunk = this.chunk;
		world.midX = chunk.w / 2;
		world.midZ = chunk.w;
		world.maxX = chunk.w * world.radius + (chunk.w / 2);
		world.maxZ = chunk.w * world.radius;
	},

	textures: {},
	materials: {},

	block: {
		size: 1
	},

	chunk: {
		w: 16,
		h: 20
	},

	server: {
		maxClients: 5,
	},

	world: {
		radius: 2,
		midX: -1,
		midZ: -1,
		maxX: -1,
		maxZ: -1,
		noise: {
			x: 13,
			y: 10,
			z: 13
		},
		seaLevel: 15.5
	},

	rounds: {
		total: 2,
		duration: {
			born: 3,
			firstRoundReady: 7,
			roundReady: 4,
			round: 2 * 60,
			roundOver: 4,
			gameOver: 10
		}
	},

	safeTime: 3500,
	guideSpawnTime: 1000

};

if (typeof module !== "undefined") {
	module.exports = data;
}

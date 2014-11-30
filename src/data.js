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

	world: {
		radius: 2,
		midX: -1,
		midZ: -1,
		maxX: -1,
		maxZ: -1
	},

	safeTime: 3500
};

if (typeof module !== "undefined") {
	module.exports = data;
}

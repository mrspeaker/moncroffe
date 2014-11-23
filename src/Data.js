var Data = {
	init: function () {
		this.world.midX = this.chunk.w / 2;
		this.world.midZ = this.chunk.w;
		this.world.maxX = this.chunk.w * this.world.radius + (this.chunk.w / 2);
		this.world.maxZ = this.chunk.w * this.world.radius;
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
	}
};

if (typeof module !== "undefined") {
	module.exports = Data;
}

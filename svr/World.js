"use strict";

var Perlin = require("../lib/Perlin.js"),
	data = require("../src/data.js");

var World = {

	seed: 42,
	startTime: 0,
	elapsed: 0,
	stateStartTime: 0,

	clients: [],
	players: [],
	targets: [],
	bullets: [],
	bouy: null,

	flash: false,

	state: null,
	stateFirst: true,
	remaining: 0,

	round: 0,

	init: function () {

		data.init();
		this.data = data;
		this.resetAll();
	},

	resetAll: function () {

		this.setState("BORN");
		this.reset(true);

	},

	reset: function (refreshSeed) {

		this.startTime = Date.now();
		this.roundEndTime = Date.now();
		this.elapsed = 0;
		this.bouy = null;

		if (refreshSeed) {
			this.seed = Math.random() * 99999999 | 0;
			Perlin.noise.seed(this.seed);
		}
		console.log("Reset:", this.seed);

	},

	setState: function (state) {

		this.state = state;
		this.stateStartTime = Date.now();
		this.stateFirst = true;

	},

	tick: function () {

		if (!this.clients.length) {
			return;
		}

		var stateElapsed = this.stateElapsed = (Date.now() - this.stateStartTime) / 1000,
			state = this.state;

		this.elapsed = (Date.now() - this.startTime) / 1000;

		switch (state) {

		case "BORN":
			if (this.stateFirst) {
				// Reset all player's scores...
				this.players.forEach(function (p) {
					p.score = 0;
				});

				this.round = 0;
				this.stateFirst = false;
			}

			if (stateElapsed > data.rounds.duration.born) {
				this.setState("ROUND_READY");
			}
			break;

		case "ROUND_READY":
			if (this.stateFirst) {
				this.remaining = 0;
				this.reset(false);
				this.stateFirst = false;
			}
			if (stateElapsed > data.rounds.duration.roundReady) {
				this.setState("ROUND");
			}
			break;

		case "ROUND":
			if (this.stateFirst) {
				this.roundEndTime = stateElapsed + data.rounds.duration.round;
				this.stateFirst = false;
			}
			if (stateElapsed > this.roundEndTime) {
				this.setState("ROUND_OVER");
				this.roundEndTime = null;
			}
			this.tick_GO();
			break;

		case "ROUND_OVER":
			if (this.stateFirst) {
				this.remaining = 0;
				this.stateFirst = false;

				if (this.round === data.rounds.total - 1) {
					this.setState("GAME_OVER");
					break;
				}
			}

			if (stateElapsed > data.rounds.duration.roundOver) {
				this.round++;
				this.setState("ROUND_READY");
			}
			break;

		case "GAME_OVER":
			if (this.stateFirst) {
				this.stateFirst = false;
			}

			if (stateElapsed > data.rounds.duration.gameOver) {
				this.resetAll();
			}
			break;
		}

	},

	tick_GO: function () {

		var xo = data.world.midX,
			zo = data.world.midZ,
			maxX = data.world.maxX,
			maxZ = data.world.maxZ;

		this.remaining = this.roundEndTime - this.stateElapsed;

		// Add a target.
		if (Math.random() < 0.01) {

			this.targets.push({
				id: Math.random() * 99999999 | 0,
				pos: {
					x: xo + (Math.random() * (maxX * 0.3) * 2) - (maxX * 0.3),
					y: (Math.random() * 13 | 0) + 0.75,
					z: zo + (Math.random() * (maxZ * 0.3) * 2) - (maxZ * 0.3)
				},
				rot: {
					x: Math.random() - 0.5,
					y: 0,
					z: Math.random() - 0.5
				},
				speed: (Math.random() * 4) + 1
			});

		}

		if (!this.bouy && Math.random () < 0.01) {

			this.bouy = this.getSafePos();

		}

	},

	getSafePos: function () {

		var xo = data.world.midX,
			zo = data.world.midZ,
			maxX = data.world.maxX,
			maxZ = data.world.maxZ,
			safe = false,
			pos;

		while (!safe) {

			pos = { x: Math.floor(xo + (Math.random() * (maxX * 0.97) * 2) - (maxX * 0.97)),
				y: Math.floor(Math.random() * 18 | 0) + 1,
				z: Math.floor(zo + (Math.random() * (maxZ * 0.97) * 2) - (maxZ * 0.97))
			};

			var val = Perlin.noise.simplex3(pos.x / 15, pos.y / 10, pos.z / 15);

			if (val < 0.01) {
				safe = true;
			}

		}

		return pos;

	},

	gotBouy: function (id) {

		this.flash = id;
		this.bouy = null;

	}
};

module.exports = World;


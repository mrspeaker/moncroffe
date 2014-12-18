"use strict";

var Perlin = require("../lib/Perlin.js"),
	data = require("../src/data.js"),
	UUID = require("uuid");

var World = {

	id: null,

	seed: 42,
	startTime: 0,
	elapsed: 0,
	stateStartTime: 0,

	clients: null,
	players: null,
	targets: null,
	bullets: null,
	bouy: null,
	lastTargetTime: Date.now(),

	flash: false,

	state: null,
	stateFirst: true,
	remaining: 0,

	round: 0,
	roundsEverStarted: false,

	init: function () {

		this.id = UUID();

		this.clients = [];
		this.players = [];
		this.targets = [];
		this.bullets = [];

		data.init();
		this.data = data;
		this.resetAll();

		return this;
	},

	initPlayer: function (client) {

		var player;

		client.userid = UUID();
		client.lastHit = Date.now();
		client.lastGetBouy = Date.now();

		player = {
			id: client.userid,
			score: 0,
			pos: { x: 0, y: 0, z: 0 },
			rot: { x: 0, z: 0}
		};

		client.stats = {
			hits: 0,
			deaths: 0
		};

		this.clients.push(client);
		this.players.push(player);

		client.player = player;

	},

	removePlayer: function (userid) {

		this.players = this.players.filter(function (p) {

			return p.id !== userid;

		});

		this.clients = this.clients.filter(function (c) {

			if (c.userid !== userid) {
				c.emit("dropped", userid);
			}
			return c.userid !== userid;

		});

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
			return false;
		}

		var stateElapsed = this.stateElapsed = (Date.now() - this.stateStartTime) / 1000,
			state = this.state,
			readyDuration;

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
			readyDuration = this.round === 0 ?
				data.rounds.duration.firstRoundReady :
				data.rounds.duration.roundReady;

			if (stateElapsed > readyDuration) {
				this.setState("ROUND");
			}
			break;

		case "ROUND":
			if (this.stateFirst) {
				this.roundEndTime = stateElapsed + data.rounds.duration.round;
				this.stateFirst = false;
				this.setEveryoneSafe();
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

				this.sendHi();
			}

			if (stateElapsed > data.rounds.duration.roundOver) {
				this.round++;
				this.setState("ROUND_READY");
				this.roundsEverStarted = false; // If player dropped out last round, resart if the re-join.
			}
			break;

		case "GAME_OVER":
			if (this.stateFirst) {
				this.stateFirst = false;
				this.sendHi();
			}

			if (stateElapsed > data.rounds.duration.gameOver) {
				this.resetAll();
			}
			break;
		}

		return true;

	},

	setEveryoneSafe: function () {

		this.clients.forEach(function (c) {
			c.lastHit = Date.now();
		});

	},

	sendHi: function () {

		var his = this.clients.map(function (c) {

			return {
				id: c.userid,
				score: c.player.score,
				hits: c.stats.hits,
				deaths: c.stats.deaths
			};

		}).sort(function (a, b) {

			if (a.score !== b.score) {
				return b.score - a.score;
			}

			if (a.hits !== b.hits) {
				return b.hits - a.hits;
			}
			if (a.deaths !== b.deaths) {
				return b.deaths - a.deaths;
			}
			return Math.random() < 0.5;

		});


		this.clients.forEach(function (c) {

			c.emit("scores", his);

		});

	},

	tick_GO: function () {

		var xo = data.world.midX,
			zo = data.world.midZ,
			maxX = data.world.maxX,
			maxZ = data.world.maxZ,
			now = Date.now();

		this.remaining = this.roundEndTime - this.stateElapsed;

		// Add a target.
		if (now - this.lastTargetTime > data.guideSpawnTime) {

			this.lastTargetTime = now;

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
			pos,
			tries = 0;

		while (tries++ < 150 && !safe) {

			pos = {
				x: Math.floor(xo + (Math.random() * (maxX * 0.97) * 2) - (maxX * 0.97)),
				y: Math.floor(Math.random() * 18 | 0) + 1,
				z: Math.floor(zo + (Math.random() * (maxZ * 0.97) * 2) - (maxZ * 0.97))
			};

			var val = Perlin.noise.simplex3(pos.x / data.world.noise.x, pos.y / data.world.noise.y, pos.z / data.world.noise.z);

			if (val < -0.2 && val > -0.3) {
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


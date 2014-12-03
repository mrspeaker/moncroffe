"use strict";

var World = require("./World.js");

var Worlds = {

	worlds: null,
	waitingPlayers: null,
	leaderboards: null,

	init: function () {
		this.worlds = [];
		this.waitingPlayers = [];
		this.leaderboards = {};

		return this;
	},

	addWorld: function () {
		var world = Object.create(World).init();
		this.worlds.push(world);
		return world;
	},

	tick: function () {
		// tick all worlds
		this.worlds = this.worlds.filter(function (w) {
			return w.tick();
		});
	},

	ping: function () {

		this.worlds.forEach(function (World) {

			World.clients.forEach(function (c) {

				c.emit("ping", {
					elapsed: World.elapsed,
					remaining: World.remaining,
					players: World.players,
					bullets: World.bullets,
					targets: World.targets,
					// Should come as seperate messages, yo.
					state: World.state,
					bouy: World.bouy,
					seed: World.seed,
					flash: World.flash,
					round: World.round
				});

			});

			World.flash = false;
			World.targets = [];

		});

	}

};

module.exports = Worlds;

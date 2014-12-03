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
	}

};

module.exports = Worlds;

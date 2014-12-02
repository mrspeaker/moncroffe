"use strict";

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

	tick: function () {
		// tick all worlds
		this.worlds = this.worlds.filter(function (w) {
			return w.tick();
		});
	}

};

module.exports = Worlds;

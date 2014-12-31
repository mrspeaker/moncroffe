"use strict";

var World = require("./World.js"),
	core = require("../src/core.js"),
	data = require("../src/data.js");

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
		console.log("Created new world:", world.id);

		this.worlds.push(world);

		return world;

	},

	getWorld: function () {

		// Find a world with free spots
		var world = this.worlds.reduce(function (ac, el) {
			if (ac) return ac;
			if (el.clients.length < data.server.maxClients) {
				console.log("Joining world:", el.id);
				return el;
			}
		}, null);

		// ... or create a new one.
		return world || this.addWorld();

	},

	joinAWorld: function (client, playerName) {

		var cleanName = core.utils.cleanInput(playerName, 3, 15),
			World = this.getWorld();

		if (!World.clients.length) {
			// First person joining.
			World.resetAll();
		}

		// Restart if second person joins for the first time
		if (World.clients.length === 1 && !World.roundsEverStarted) {
			// Second person joining.
			World.setState("BORN");
			World.reset(false);
			World.roundsEverStarted = true;
		}

		World.addAndInitPlayer(client, cleanName);

		client.emit("onconnected", {
			id: client.userid,
			seed: World.seed
		});

	},

	listenToWorldEvents: function (client) {

		// Todo: move client logic to player/client.
		client.on("disconnect", function () {

			var pn = this.player ? " (" + this.player.name + ")" : "";

			console.log("Network:: " + this.userid + pn + " disconnected");

			this.world.removePlayer(this.userid);

		});

		client.on("ping", function (ping) {

			this.world.players.forEach(function (p) {

				if (ping.clientId === p.id) {
					p.pos.x = ping.pos.x;
					p.pos.y = ping.pos.y;
					p.pos.z = ping.pos.z;

					p.rot = ping.rot;
				}

			});

		});

		// NOTE: All the "hit" events should be calc-ed on server,
		// not sent by the client! We don't trust 'em.

		client.on("clownHit", function (id) {

			this.world.clients.forEach(function (c) {

				c.emit("clownDestroyed", id);

			});

		});

		client.on("powerballGotByMe", function (pid) {

			this.world.clients.forEach(function (c) {

				if (c === client) return;
				c.emit("powerballGotByOthers", pid);

			});

		});

		client.on("fireBullet", function (bullet) {

			// todo - keep time stamp or something

			this.world.clients.forEach(function (c) {

				if (c === client) return;
				c.emit("otherFiredBullet", bullet);

			});

		});

		client.on("shotPlayer", function (player) {

			// Check if shot is too soon
			var shotPlayer = this.world.clients.filter(function (c) {
					return c.userid === player;
				}),
				now = Date.now();

			if (!shotPlayer.length) {
				console.log("erp... no player with this id");
				return;
			}

			shotPlayer = shotPlayer[0];
			if (now - shotPlayer.lastHit < data.safeTime) {
				return;
			}
			shotPlayer.lastHit = now;

			// TODO: move these to player.stats?
			this.stats.hits++;
			shotPlayer.stats.deaths++;

			this.world.clients.forEach(function (c) {

				c.emit("receiveShotPlayer", {
					hit: player,
					by: this.userid
				});

			}, this);

		});

		client.on("gotBouy", function (pid) {

			var now = Date.now(),
				legit = true,
				World = this.world;

			// Check for distance
			if (now - this.lastGetBouy < 1000) {
				console.log("Too early for another bouy");
				legit = false;
			}

			if (!World.bouy) {
				console.error("Hmm... no bouy, but more tha 1000ms");
				legit = false;
			}

			if (legit) {
				// Check for distance
				client.lastGetBouy = now;
				World.players = World.players.map(function (p) {

					if (p.id === pid) {
						if (core.utils.dist(p.pos, World.bouy) > 4) {
							console.log("hmmm... cheaty?");
							legit = false;
						} else {
							p.score++;
						}
					}
					return p;

				});
			}

			// Reset and party
			if (legit) {
				World.gotBouy(pid);
			}

		});

		client.on("sendChat", function (msg) {

			this.world.clients.forEach(function (c) {

				c.emit("receiveChat", msg);

			});

		});
	},

	tick: function () {

		// tick all worlds
		this.worlds = this.worlds.filter(function (w) {

			var res = w.tick();
			if (!res) {
				console.log("World removed: ", w.id);
			}
			return res;

		});

	},

	ping: function () {

		this.worlds.forEach(function (World) {

			World.clients.forEach(function (c) {

				c.emit("world/ping", {
					elapsed: World.elapsed,
					remaining: World.remaining,
					players: World.players,
					bullets: World.bullets,
					targets: World.targets,
					// Should come as seperate messages, yo.
					state: World.state,
					bouy: World.bouy,
					bonus: World.bonus,
					seed: World.seed,
					flash: World.flash,
					round: World.round
				});

			});

			World.flash = false;
			World.targets = [];
			World.bonus = null;

		});

	}

};

module.exports = Worlds;

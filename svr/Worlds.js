"use strict";

var World = require("./World.js"),
	utils = require("./utils.js");

var Worlds = {

	worlds: null,
	waitingPlayers: null,
	leaderboards: null,

	init: function () {

		this.worlds = [];
		this.waitingPlayers = [];
		this.leaderboards = {};

		// TODO: only 1 world at the moment!
		// And clients all connect to it automatically.
		this.addWorld();

		return this;
	},

	addWorld: function () {

		var world = Object.create(World).init();

		this.worlds.push(world);

		return world;
	},

	onClientConnected: function (client) {

		var World = this.worlds[0];

		if (!World.clients.length) {
			World.resetAll();
		}

		World.initPlayer(client);

		console.log("Network:: " + client.userid + " connected");

		// Todo: move client logic to player/client.
		client.on("disconnect", function () {

			console.log("Network:: " + client.userid + " (" + client.userName + ") disconnected");

			World.removePlayer(client.userid);

		});

		client.on("join", function (name) {

			// Update name
			World.players.forEach(function (p) {

				if (client.userid === p.id) {
					p.name = name;
				}

			});

			client.emit("onconnected", {
				id: client.userid,
				seed: World.seed
			});

			client.userName = name;

		});

		client.on("ping", function (ping) {

			World.players.forEach(function (p) {

				if (ping.clientId === p.id) {
					p.pos.x = ping.pos.x;
					p.pos.y = ping.pos.y;
					p.pos.z = ping.pos.z;

					p.rot = ping.rot;
				}

			});

		});

		// tmp: should be calced on server
		client.on("clownHit", function (id) {

			World.clients.forEach(function (c) {

				if (c === client) return;
				c.emit("clownDestroyed", id);

			});

		});

		client.on("fireBullet", function (bullet) {

			World.clients.forEach(function (c) {

				if (c === client) return;
				c.emit("otherFiredBullet", bullet);

			});

		});

		client.on("shotPlayer", function (player) {

			// Check if shot is too soon
			var shotPlayer = World.clients.filter(function (c) {
					return c.userid === player;
				}),
				now = Date.now();

			if (!shotPlayer.length) {
				console.log("erp... no player with this id");
				return;
			}

			shotPlayer = shotPlayer[0];
			if (now - shotPlayer.lastHit < World.data.safeTime) {
				return;
			}
			shotPlayer.lastHit = now;

			World.clients.forEach(function (c) {
				c.emit("receiveShotPlayer", player);
			});

		});

		client.on("gotBouy", function (pid) {

			var now = Date.now(),
				legit = true;

			// Check for distance
			if (now - client.lastGetBouy < 1000) {
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
						if (utils.dist(p.pos, World.bouy) > 4) {
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

			World.clients.forEach(function (c) {

				c.emit("receiveChat", msg);

			});

		});
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

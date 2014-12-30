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

	onClientConnected: function (client, io) {

		var World = this.getWorld();

		if (!World.clients.length) {
			// First person joining.
			World.resetAll();
		}

		client.join("lobby");
		// client.broadcast.to('lobby').emit("welcomToLobby"); - sends to all except client.
		io.sockets.in("lobby").emit("lobby/welcome"); // - sends to all in room.
		// console.log(io.sockets.adapter.rooms); - get all rooms

		// Restart if second person joins for the first time
		if (World.clients.length === 1 && !World.roundsEverStarted) {
			// Second person joining.
			World.setState("BORN");
			World.reset(false);
			World.roundsEverStarted = true;
		}

		World.initPlayer(client);

		console.log("Network:: " + client.userid + " connected");

		// Todo: move client logic to player/client.
		client.on("disconnect", function () {

			console.log("Network:: " + client.userid + " (" + client.player.name + ") disconnected");

			World.removePlayer(client.userid);

		});

		client.on("joinTheWorld", function (name) {

			client.leave("lobby");
			client.join("universe");
			io.sockets.in('universe').emit("world/welcome", name);

			name = core.utils.cleanInput(name, 3, 15);

			// Update name
			client.player.name = name;

			client.emit("onconnected", {
				id: client.userid,
				seed: World.seed
			});


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

				c.emit("clownDestroyed", id);

			});

		});

		client.on("powerballGotByMe", function (pid) {

			World.clients.forEach(function (c) {

				if (c === client) return;
				c.emit("powerballGotByOthers", pid);

			});

		});

		client.on("fireBullet", function (bullet) {

			// todo - keep time stamp or something

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
			if (now - shotPlayer.lastHit < data.safeTime) {
				return;
			}
			shotPlayer.lastHit = now;

			// TODO: move these to player.stats?
			client.stats.hits++;
			shotPlayer.stats.deaths++;

			World.clients.forEach(function (c) {
				c.emit("receiveShotPlayer", {
					hit: player,
					by: client.userid
				});
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

			World.clients.forEach(function (c) {

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

				c.emit("ping", {
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

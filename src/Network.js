(function (main) {

	"use strict";

	var Network = {

		clientId: null,
		socket: null,

		pingEvery: 40,
		lastPingSent: null,
		lastPingRec: null,

		clients: {},

		world: null,

		getName: function (id) {

			if (id === this.clientId) {
				return this.name;
			}

			return this.clients[id] ? this.clients[id].name : "???";

		},

		init: function (name, joinCb) {
			this.lastPingSent = Date.now();
			this.lastPingRec = Date.now();
			this.world = {
				seed: null
			};

			this.name = name;
			this.socket = window.io();

			// Listeners
			this.socket.on("onconnected", (function (data) {
				this.connectedRecieved(data, joinCb);
			}).bind(this));
			this.socket.on("resetGame", this.resetGame.bind(this));
			this.socket.on("ping", this.pingRecieved.bind(this));
			this.socket.on("dropped", this.dropReceived.bind(this));

			this.socket.on("clownDestroyed", this.clownDestroyed.bind(this));
			this.socket.on("otherFiredBullet", this.otherFiredBullet.bind(this));
			this.socket.on("shotThePlayer", this.shotThePlayer.bind(this));

			// Let's go!
			this.socket.emit("join", name);

			return this;
		},

		tick: function (model) {
			// Do update ping
			var now = Date.now();
			if (this.clientId && now - this.lastPingSent > this.pingEvery) {
				this.lastPingSent = now;
				this.pingSend(model.pos, model.rot);
			}
		},

		resetGame : function (data) {
			console.log("Reset!");
			this.world.seed = data.seed;
			main.startGame();
		},

		connectedRecieved: function (data, cb) {
			this.clientId = data.id;
			this.world.seed = data.seed;
			console.log("Connected as:", data.id, " seed:", data.seed);
			cb && cb();
		},

		dropReceived: function (id) {
			console.log("Client left:", id);
			var c = this.clients[id];

			if (c) {
				// TODO: derp, global ref
				main.screen.scene.remove(c.mesh);
				delete this.clients[id];
			}
		},

		pingRecieved: function (ping) {
			if (!this.clientId) {
				return;
			}

			// Get delta since last ping
			this.delta = (ping.elapsed - this.lastPingRec) * 1000;
			this.lastPingRec = ping.elapsed;

			if (main.screen.pingReceived) {
				main.screen.pingReceived(ping, ping.elapsed, this.delta);
			}

		},

		pingSend: function (pos, rot) {
			this.socket.emit("ping", {
				clientId: this.clientId,
				pos: {
					x: pos.x,
					y: pos.y,
					z: pos.z
				},
				rot: rot
			});
		},

		// tmp: should be calced on server
		targetHit: function (tid) {
			this.socket.emit("clownHit", tid);
		},

		// tmp: should be calced on server
		clownDestroyed : function (tid) {
			main.screen.clownDestroyed(tid);
		},

		fireBullet: function (bullet) {
			this.socket.emit("fireBullet", bullet);
		},

		otherFiredBullet: function (bullet) {
			main.screen.otherFiredBullet(bullet);
		},

		shotPlayer: function (pid) {
			this.socket.emit("shotPlayer", pid);
		},

		shotThePlayer: function (pid) {
			console.log("a player shot:: ", pid);
			main.screen.shotThePlayer(pid);
		},

		gotBouy: function() {
			this.socket.emit("gotBouy", this.clientId);
		}

	};

	window.Network = Network;

}(window.main));

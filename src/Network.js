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

		getPlayer: function (id) {

			return id === this.clientId ? this : this.clients[id];

		},

		getName: function (id) {

			var player = this.getPlayer(id);

			return player ? player.name : "???";

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
				this.connectedReceived(data, joinCb);
			}).bind(this));
			this.socket.on("ping", this.pingReceived.bind(this));
			this.socket.on("dropped", this.dropReceived.bind(this));

			this.socket.on("clownDestroyed", this.clownDestroyed.bind(this));
			this.socket.on("otherFiredBullet", this.otherFiredBullet.bind(this));
			this.socket.on("receiveShotPlayer", this.receiveShotPlayer.bind(this));
			this.socket.on("receiveChat", this.receiveChat.bind(this));
			this.socket.on("scores", function (s) {
				main.screen.receiveScores(s);
			});

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

		connectedReceived: function (data, cb) {

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
				main.screen.receiveChat([-1, c.name + " left."]);
				main.screen.scene.remove(c.mesh);
				delete this.clients[id];
			}

		},

		pingReceived: function (ping) {

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

		receiveShotPlayer: function (hitData) {

			main.screen.receiveShotPlayer(hitData);

		},

		gotBouy: function() {

			this.socket.emit("gotBouy", this.clientId);

		},

		sendChat: function (msg) {

			this.socket.emit("sendChat", [this.clientId, msg]);

		},

		receiveChat: function (msg) {


			main.screen.receiveChat(msg);

		}


	};

	window.Network = Network;

}(window.main));

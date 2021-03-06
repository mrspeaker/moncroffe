(function () {

	"use strict";

	var Network = {

		clientId: null,
		socket: null,

		pingEvery: 40,
		lastPingSent: null,
		lastPingRec: null,

		clients: null,

		world: null,

		getPlayer: function (id) {

			return this.clients[id || this.clientId];

		},

		getName: function (id) {

			var player = this.getPlayer(id);

			return player ? player.name : "???";

		},

		init: function () {

			this.clients = {};
			this.name = null;
			this.lastPingSent = Date.now();
			this.lastPingRec = Date.now();
			this.world = {
				seed: null
			};


			this.initSocket();

			return this;
		},

		initSocket: function () {

			if (this.socket) {

				console.log("Already connected, yo.", this.socket);

				return this;

			}

			var socket = this.socket = window.io(window.location.host,  {
				reconnection: true
			});

			socket.io.on("reconnect", function () {

				// TODO: lol.
				console.log("DISCON AND RREFRESH");
				socket.io.disconnect();
				setTimeout(function () {

					window.askToLeave = false;
					window.location.href = window.location.href;

				}, 250);

			});

			socket.on("lobby/welcome", function () {

				console.log("Welcome to the lobby!");

			});
			socket.on("world/welcome", function () {

				console.log("All you've got to lose is your viginity.");

			});

			// Listeners // TODO: namespace events
			socket.on("joinedAWorld", (function (data) {

				// todo: umm, cb was for before... still needed?
				this.joinedAWorld(data, function () {});

			}).bind(this));

			socket.on("world/ping", this.pingReceived.bind(this));
			socket.on("dropped", this.dropReceived.bind(this));

			socket.on("clownDestroyed", this.clownDestroyed.bind(this));
			socket.on("powerballGotByOthers", this.powerballGotByOthers.bind(this));
			socket.on("otherFiredBullet", this.otherFiredBullet.bind(this));
			socket.on("receiveShotPlayer", this.receiveShotPlayer.bind(this));
			socket.on("receiveChat", this.receiveChat.bind(this));
			socket.on("scores", function (s) {

				main.screen.receiveScores(s);

			});

			socket.on("hiscores", function (s) {

				main.screen.receiveHiScores && main.screen.receiveHiScores(s);

			});

		},

		joinTheWorld: function (name) {

			this.socket.emit("joinTheWorld", name);

		},

		leaveTheWorld: function () {

			this.socket.emit("leaveTheWorld", name);

		},

		tick: function (model) {

			// Do update ping
			var now = Date.now();

			if (this.clientId && now - this.lastPingSent > this.pingEvery) {

				this.lastPingSent = now;
				this.pingSend(model.pos, model.rot);

			}

		},

		joinedAWorld: function (data, cb) {

			this.clientId = data.id;
			this.world.seed = data.seed;
			console.log("Joined as:", data.id, " seed:", data.seed);
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

		powerballGotByMe: function (pid) {

			this.socket.emit("powerballGotByMe", pid);

		},

		powerballGotByOthers: function (pid) {

			main.screen.powerballGotByOthers(pid);

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

}());

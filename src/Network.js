var Network = {

	clientId: null,
	socket: null,

	pingEvery: 40,
	lastPingSent: null,
	lastPingRec: null,

	clients: {},

	world: null,

	init: function (joinCb) {
		this.lastPingSent = Date.now();
		this.lastPingRec = Date.now();
		this.world = {
			seed: null
		};

		this.socket = io();

		// Listeners
		this.socket.on("onconnected", (function (data) {
			this.connectedRecieved(data, joinCb);
		}).bind(this));
		this.socket.on("ping", this.pingRecieved.bind(this));
		this.socket.on("dropped", this.dropReceived.bind(this));

		this.socket.on("pumpkinDestroyed", this.pumpkinDestroyed.bind(this));
		this.socket.on("otherFiredBullet", this.otherFiredBullet.bind(this));
		this.socket.on("shotThePlayer", this.shotThePlayer.bind(this));

		// Let's go!
		this.socket.emit("join");

		return this;
	},

	tick: function (mesh) {
		// Do update ping
		var now = Date.now();
		if (this.clientId && now - this.lastPingSent > this.pingEvery) {
			this.lastPingSent = now;
			this.pingSend(mesh.position, mesh.rotation.y);
		}
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

		// TODO: derp, global ref
		main.screen.scene.remove(p.mesh);
		delete this.clients[id];
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
		this.socket.emit("pumpkinHit", tid);
	},

	// tmp: should be calced on server
	pumpkinDestroyed : function (tid) {
		main.screen.pumpkinDestroyed(tid);
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
	}

}

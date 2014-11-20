var Network = {

	clientId: null,
	socket: null,
	lastPing: null,
	pingEvery: 40,

	players: {},

	world: null,

	init: function (joinCb) {
		this.lastPing = Date.now();
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

		// Let's go!
		this.socket.emit("join");

		return this;
	},

	tick: function (mesh) {
		// Do update ping
		var now = Date.now();
		if (this.clientId && now - this.lastPing > this.pingEvery) {
			this.lastPing = now;
			this.pingSend(mesh.position);
		}
	},

	connectedRecieved: function (data, cb) {
		this.clientId = data.id;
		this.world.seed = data.seed;
		console.log("Connected as:", data.id, " seed:", data.seed);
		cb && cb();
	},

	dropReceived: function (id) {
		console.log("Player left:", id);
		var p = this.players[id];

		// TODO: derp, global ref
		main.screen.scene.remove(p.mesh);
		delete this.players[id];
	},

	pingRecieved: function (ping) {
		if (!this.clientId) {
			return;
		}

		ping.players.forEach(function (p) {
			if (p.id === this.clientId) {
				return;
			}
			var player = this.players[p.id];

			if (!this.players[p.id]) {
				console.log("Player joined:", p.id);
				player = this.players[p.id] = Object.create(PlayerProxy).init(p.id);

				// TODO: derp, global ref
				main.screen.scene.add(player.mesh);
			}

			// Update it
			player.mesh.position.set(
				p.position.x,
				p.position.y,
				p.position.z
			);
		}, this);

		// TODO: derp, global ref
		main.screen.world.elapsed = ping.elapsed;
	},

	pingSend: function (pos) {
		this.socket.emit("ping", {
			clientId: this.clientId,
			pos: {
				x: pos.x,
				y: pos.y,
				z: pos.z
			}
		});
	}

}

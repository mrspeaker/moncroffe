var Network = {

	clientId: null,
	socket: null,
	lastPing: null,
	pingEvery: 40,

	clients: {},

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

		ping.players.forEach(function (p) {
			if (p.id === this.clientId) {
				return;
			}
			var player = this.clients[p.id];

			if (!player) {
				console.log("Player joined:", p.id);
				player = this.clients[p.id] = Object.create(PlayerProxy).init(p.id);

				// TODO: derp, global ref
				main.screen.scene.add(player.mesh);
			}

			// Update it
			player.mesh.position.set(
				p.pos.x,
				p.pos.y,
				p.pos.z
			);
			player.mesh.rotation.set(0, p.rot, 0);
		}, this);

		// TODO: derp, global ref
		main.screen.elapsed = ping.elapsed;
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
	}

}

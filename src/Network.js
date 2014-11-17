var Network = {

	clientId: null,
	socket: null,
	connected: false,
	lastPing: null,
	pingEvery: 200,

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
		//this.socket.on("ping", this.pingRecieved.bind(this));
		//this.socket.on("dropped", this.disconnectReceived(this));

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

	dropReceived: function () {},

	pingRecieved: function () {},

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

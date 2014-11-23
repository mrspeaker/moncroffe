var express = require("express"),
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	UUID = require('uuid'),
	World = require("./World.js");

app.get('/', function(req, res){
	res.sendFile('index.html', {'root': '../'});
});

World.init();

app.use("/src", express.static(__dirname + '/../src/'));
app.use("/res", express.static(__dirname + '/../res/'));
app.use("/lib", express.static(__dirname + '/../lib/'));

io.on('connection', function(client){

	var clients = World.clients,
		players = World.players;

	if (!clients.length) {
		World.reset();
	}

	client.userid = UUID();
	console.log("Network:: " + client.userid + " connected");

	clients.push(client);
	players.push({
		id: client.userid,
		score: 0,
		pos: { x: 0, y: 0, z: 0 },
		rot: { x: 0, z: 0}
	});

	client.on("disconnect", function () {
		console.log("Network:: " + client.userid + " (" + client.name + ") disconnected");
		World.players = World.players.filter(function (p) {
			return p.id !== client.userid;
		});
		World.clients = World.clients.filter(function (c) {
			if (c !== client) {
				c.emit("dropped", client.userid);
			}
			return c !== client;
		});
	});

	client.on("ping", function(ping) {
		players.forEach(function (p) {
			if (ping.clientId === p.id) {
				p.pos.x = ping.pos.x;
				p.pos.y = ping.pos.y;
				p.pos.z = ping.pos.z;

				p.rot = ping.rot;
			}
		});
	});

	client.on("join", function (name) {

		// Update name
		players.forEach(function (p) {
			if (client.userid === p.id) {
				p.name = name;
			}
		});

		client.emit('onconnected', {
			id: client.userid,
			name: client.name,
			seed: World.seed,
			elapsed: World.elapsed
		});

	});

	// tmp: should be calced on server
	client.on("pumpkinHit", function(id) {
		World.clients.forEach(function (c) {
			if (c === client) return;
			c.emit("pumpkinDestroyed", id);
		});
	});

	client.on("fireBullet", function(bullet) {
		World.clients.forEach(function (c) {
			if (c === client) return;
			c.emit("otherFiredBullet", bullet);
		});
	});

	client.on("shotPlayer", function(player) {
		World.clients.forEach(function (c) {
			c.emit("shotThePlayer", player);
		});
	});

	client.on("gotBouy", function(pid) {
		World.players = World.players.map(function (p) {
			if (p.id === pid) {
				p.score++;
			}
			return p;
		});
		World.gotBouy();
	});

});

function runPingLoop () {

	setTimeout(function () {
		World.elapsed = (Date.now() - World.startTime) / 1000;

		World.clients.forEach(function (c) {
			c.emit("ping", {
				elapsed: World.elapsed,
				players: World.players,
				bullets: World.bullets,
				targets: World.targets,
				bouy: World.bouy,
				flash: World.flash
			});
		});
		World.flash = false;
		World.targets = [];

		runPingLoop();
	}, 40);
}

function runRenderLoop () {
	World.tick();
	setTimeout(runRenderLoop, 16);
}

http.listen(3001, function(){
	console.log('listening on *:3001');
	runPingLoop();
	runRenderLoop();
});



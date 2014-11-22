var express = require("express"),
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	World = require("./World.js");

app.get('/', function(req, res){
	res.sendFile('index.html', {'root': '../'});
});

app.use("/src", express.static(__dirname + '/../src/'));
app.use("/res", express.static(__dirname + '/../res/'));
app.use("/lib", express.static(__dirname + '/../lib/'));


io.on('connection', function(client){

	var clients = World.clients,
		players = World.players;

	if (!clients.length) {
		World.reset();
	}

	client.userid = Math.random() * 99999999 | 0;
	console.log("Network:: " + client.userid + " connected");

	clients.push(client);
	players.push({
		id: client.userid,
		pos: { x: 0, y: 0, z: 0 },
		rot: { x: 0, z: 0}
	});

	client.on("disconnect", function () {
		console.log("Network:: " + client.userid + " disconnected");
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

	client.on("join", function () {
		client.emit('onconnected', {
			id: client.userid,
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

});

function runPingLoop () {

	setTimeout(function () {
		World.elapsed = (Date.now() - World.startTime) / 1000;

		World.clients.forEach(function (c) {
			c.emit("ping", {
				players: World.players,
				bullets: World.bullets,
				targets: World.targets,
				elapsed: World.elapsed
			});
		});

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



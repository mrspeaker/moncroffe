"use strict";

var express = require("express"),
	app = express(),
	http = require("http").Server(app),
	io = require("socket.io")(http),
	UUID = require("uuid"),
	World = require("./World.js");

app.get("/", function(req, res){
	res.sendFile("index.html", {"root": "../"});
});

World.init();

app.use("/src", express.static(__dirname + "/../src/"));
app.use("/res", express.static(__dirname + "/../res/"));
app.use("/lib", express.static(__dirname + "/../lib/"));

io.on("connection", function (client) {

	var clients = World.clients,
		players = World.players;

	if (!clients.length) {
		World.reset();
	}

	client.userid = UUID();
	client.lastHit = Date.now();
	client.lastGetBouy = Date.now();
	clients.push(client);

	console.log("Network:: " + client.userid + " connected");

	var player = {
		id: client.userid,
		score: 0,
		pos: { x: 0, y: 0, z: 0 },
		rot: { x: 0, z: 0}
	};
	players.push(player);
	client.player = player;

	if (World.players.length !== World.clients.length) {
		console.log("connect diff:", World.players.length, World.clients.length);
	}

	client.on("disconnect", function () {

		console.log("Network:: " + client.userid + " (" + client.userName + ") disconnected");
		World.players = World.players.filter(function (p) {

			return p.id !== client.userid;

		});

		World.clients = World.clients.filter(function (c) {

			if (c !== client) {
				c.emit("dropped", client.userid);
			}
			return c !== client;

		});

		if (World.players.length !== World.clients.length) {
			console.log("disconnect diff:", World.players.length, World.clients.length);
		}
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

		client.emit("onconnected", {
			id: client.userid,
			name: client.name,
			seed: World.seed,
			elapsed: World.elapsed
		});

		client.userName = name;

	});

	// tmp: should be calced on server
	client.on("clownHit", function(id) {

		World.clients.forEach(function (c) {

			if (c === client) return;
			c.emit("clownDestroyed", id);

		});

	});

	client.on("fireBullet", function(bullet) {

		World.clients.forEach(function (c) {

			if (c === client) return;
			c.emit("otherFiredBullet", bullet);

		});

	});

	client.on("shotPlayer", function(player) {

		// Check if shot is too soon
		var shotPlayer = World.clients.filter(function (c) {
				return c.userid = player;
			}),
			now = Date.now();

		if (!shotPlayer.length) {
			console.log("erp... no player with this id");
			return;
		}

		shotPlayer = shotPlayer[0];
		if (now - shotPlayer.lastHit < World.data.safeTime) {
			return;
		}
		shotPlayer.lastHit = now;

		World.clients.forEach(function (c) {
			c.emit("shotThePlayer", player);
		});

	});

	client.on("gotBouy", function(pid) {

		var now = Date.now(),
			legit = true;

		// Check for distance
		if (now - client.lastGetBouy < 1000) {
			console.log("Too early for another bouy");
			legit = false;
		}

		if (legit) {
			// Check for distance
			client.lastGetBouy = now;
			World.players = World.players.map(function (p) {

				if (p.id === pid) {
					if (utils.dist(p.pos, World.bouy) > 4) {
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

	client.on("sendChat", function(msg) {

		World.clients.forEach(function (c) {

			//if (c === client) return;

			c.emit("recieveChat", msg);

		});

	});

});

function runPingLoop () {

	setTimeout(function () {

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
				seed: World.seed,
				flash: World.flash,
				round: World.round
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
	console.log("listening on *:3001");
	runPingLoop();
	runRenderLoop();
});

var utils = {};
utils.dist = function (v1, v2) {
	var dx = v1.x - v2.x,
		dy = v1.y - v2.y,
		dz = v1.z - v2.z;

	return Math.sqrt(dx * dx + dy * dy + dz * dz);
};


"use strict";

var express = require("express"),
	app = express(),
	http = require("http").Server(app),
	io = require("socket.io")(http),
	Worlds = require("./Worlds.js");

app.get("/", function(req, res){
	res.sendFile("index.html", {"root": "../"});
});

Worlds.init();

// TODO: move all World references to Worlds.
var World = Worlds.addWorld();

app.use("/src", express.static(__dirname + "/../src/"));
app.use("/res", express.static(__dirname + "/../res/"));
app.use("/lib", express.static(__dirname + "/../lib/"));

io.on("connection", function (client) {

	if (!World.clients.length) {
		World.resetAll();
	}

	World.initPlayer(client);
	Worlds.onClientConnected(client, World);

});

function loopPing () {
	Worlds.ping();
	setTimeout(loopPing, 40);
}

function loopTick () {
	Worlds.tick();
	setTimeout(loopTick, 16);
}

http.listen(3001, function(){
	console.log("listening on *:3001");
	loopTick();
	loopPing();
});

var utils = {};
utils.dist = function (v1, v2) {
	var dx = v1.x - v2.x,
		dy = v1.y - v2.y,
		dz = v1.z - v2.z;

	return Math.sqrt(dx * dx + dy * dy + dz * dz);
};


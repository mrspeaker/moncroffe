"use strict";

var express = require("express"),
	app = express(),
	http = require("http").Server(app),
	io = require("socket.io")(http),
	Worlds = require("./Worlds.js"),
	port = 3001;

app.get("/", function(req, res){
	res.sendFile("index.html", {"root": "../"});
});

Worlds.init();

app.use("/src", express.static(__dirname + "/../src/"));
app.use("/res", express.static(__dirname + "/../res/"));
app.use("/lib", express.static(__dirname + "/../lib/"));

io.on("connection", function (client) {

	// join lobby
	client.join("lobby");
	// client.broadcast.to('lobby').emit("welcomToLobby"); - sends to all except client.
	io.sockets.in("lobby").emit("lobby/welcome"); // - sends to all in room.
	// console.log(io.sockets.adapter.rooms); - get all rooms

	console.log("Network :: player initial connection");

	// Listen to world events
	Worlds.listenToWorldEvents(client);


	client.on("joinTheWorld", function (playerName) {

		this.leave("lobby");
		this.join("universe");
		io.sockets.in('universe').emit("world/welcome", playerName);

		Worlds.joinAWorld(this, playerName);

	});


	// Not used yet.
	client.on("leaveTheWorld", function () {

		this.leave("universe");
		this.join("lobby");

	});

});

function loopPing () {

	Worlds.ping();
	setTimeout(loopPing, 40);

}

function loopTick () {

	Worlds.tick();
	setTimeout(loopTick, 16);

}

http.listen(port, function () {

	console.log("listening on *:" + port);
	loopTick();
	loopPing();

});

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

app.use("/src", express.static(__dirname + "/../src/"));
app.use("/res", express.static(__dirname + "/../res/"));
app.use("/lib", express.static(__dirname + "/../lib/"));

io.on("connection", function (client) {

	Worlds.onClientConnected(client);

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

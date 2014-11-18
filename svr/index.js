var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var players = [],
	clients = [];

app.get('/', function(req, res){
	res.sendFile('index.html', {'root': '../'});
});

app.use("/src", express.static(__dirname + '/../src/'));
app.use("/res", express.static(__dirname + '/../res/'));
app.use("/lib", express.static(__dirname + '/../lib/'));


var World = {
	seed: Math.random() * 99999999 | 0,
	startTime: Date.now(),
	elapsed: 0,
};

io.on('connection', function(client){

	client.userid = Math.random() * 99999999 | 0;
	console.log("Network:: " + client.userid + " connected");

	clients.push(client);
	players.push({
		id: client.userid,
		position: { x: 0, y: 0, z: 0 }
	});

	client.on("disconnect", function () {
		console.log("Network:: " + client.userid + " disconnected");
		players = players.filter(function (p) {
			return p.id !== client.userid;
		});
		clients = clients.filter(function (c) {
			if (c !== client) {
				c.emit("dropped", client.userid);
			}
			return c !== client;
		});
	});

	client.on("ping", function(ping) {
		players.forEach(function (p) {
			if (ping.clientId === p.id) {
				p.position.x = ping.pos.x;
				p.position.y = ping.pos.y;
				p.position.z = ping.pos.z;
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

});

function run () {

	setTimeout(function () {
		World.elapsed = (Date.now() - World.startTime) / 1000;

		clients.forEach(function (c) {
			c.emit("ping", {
				players: players,
				elapsed: World.elapsed
			});
		});

		run();
	}, 40);
}

http.listen(3001, function(){
	console.log('listening on *:3001');
	run();
});



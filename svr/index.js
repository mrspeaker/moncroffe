var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var players = [];

app.get('/', function(req, res){
	res.sendFile('index.html', {'root': '../'});
});

app.use("/src", express.static(__dirname + '/../src/'));
app.use("/res", express.static(__dirname + '/../res/'));
app.use("/lib", express.static(__dirname + '/../lib/'));

io.on('connection', function(client){

	client.userid = Math.random() * 99999999 | 0;
	console.log('network:: player ' + client.userid + ' connected');

	client.on('disconnect', function () {
		console.log('\t network:: client disconnected ' + client.userid );
	});

	client.emit('onconnected', { id: client.userid } );

	client.on('hit', function(pos) {
		console.log('hit at:', pos.x, pos.y, pos.z);
	});

	client.on("join", function (id) {
		players.push([{id: id, client: client}]);
	});
});

http.listen(3001, function(){
	console.log('listening on *:3001');
});



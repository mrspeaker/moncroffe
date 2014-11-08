var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
	res.sendFile('index.html', {'root': '../'});
});

app.use("/src", express.static(__dirname + '/../src/'));
app.use("/res", express.static(__dirname + '/../res/'));
app.use("/lib", express.static(__dirname + '/../lib/'));

io.on('connection', function(socket){
	console.log('User connected');
	socket.on('disconnect', function(){
		console.log('User disconnected');
	});

	socket.on('hit', function(pos) {
		console.log('hit at:', pos.x, pos.y, pos.z);
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});

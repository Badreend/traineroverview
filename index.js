
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var express  = require('express');

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
  res.sendfile('index.html');
});


io.on('connection', function(socket){

	socket.on('requestID', function(){
		console.log("ID is requested");

		var id_num = 1; // ID van device
		socket.emit("receiveID", { device_id: id_num, user_id: "Maikel"});
	})

	socket.on("dataTransfer", function(data){
		//console.log(data);
		io.sockets.emit("dataClient",data);
	});
	

socket.on('disconnect',function(data){
		io.sockets.emit('disconnect','disconnected');
		console.log('disconnect');
	})

});



var port = process.env.PORT || 5000;

http.listen(port, function(){
  console.log('Server is Online');
});


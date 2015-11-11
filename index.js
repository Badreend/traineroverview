
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var $ = require('jquery');
require('bootstrap');

var express  = require('express');
var expressHbs = require('express3-handlebars');

var hbs = expressHbs.create({
    helpers: {
        json: function(context) {
            return JSON.stringify(context);
        }
    }
});

//app.engine('html', require('consolidate').handlebars);
app.engine('html', hbs.engine);
app.set('view engine', 'html');

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
  res.sendfile('index.html');
});


io.on('connection', function(socket){
	socket.on("dataTransfer", function(data){
		console.log(data);
		io.sockets.emit("dataClient",data);
});

socket.on('disconnect',function(data){
		io.sockets.emit('disconnect','disconnected');
		console.log('disconnect');
	})

});

var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/Geert';

app.get('/rehabilitants', function(req, res){
    var results = [];
    
	pg.connect(connectionString, function(err, client, done) {

	    var query = client.query("SELECT * FROM rehabilitant WHERE active = TRUE ORDER BY id ASC");
		
        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            //return res.json(results);
            //return res.sendfile('rehabilitants.html');
            res.render('rehabilitants', { model: results });
        });
	});
});


var port = process.env.PORT || 5000;

http.listen(port, function(){
  console.log('Server is Online');
});


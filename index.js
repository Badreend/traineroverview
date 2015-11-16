
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var express  = require('express');
var expressHbs = require('express3-handlebars');

var hbs = expressHbs.create({
    helpers: {
        json: function(context) {
            return JSON.stringify(context);
        }
    },
    layoutsDir: 'views/layouts/',
    defaultLayout: 'main_layout.html',
});

app.engine('html', hbs.engine);
app.set('view engine', 'html');

app.use(express.static(__dirname + '/public'));

app.get('/ready', function(req, res){
    res.render('ready');
});

app.get('/map', function(req, res){
    res.render('map');
});

app.get('/', function(req, res){
    res.render('splash', {layout: null});
});

app.get('/login', function(req, res){
    res.render('login');
});

io.on('connection', function(socket){
	socket.on('requestID', function(){
		console.log("ID is requested");

		var id_num = 1; // ID van device
        var firstname = "Maikel";
		io.emit("receiveID", { device_id: id_num, user_id: firstname});
	})

    socket.on("pressedStart", function(data){
        io.emit("startGame");
    })

	socket.on("dataTransfer", function(data){
		//console.log(data);
		io.sockets.emit("dataClient",data);
	});
	
socket.on('disconnect',function(data){
		io.sockets.emit('disconnect','disconnected');
		console.log('disconnect');
	});

});

var pg = require('pg');
var connectionString = process.env.DATABASE_URL;

app.get('/rehabilitants', function(req, res){
    var results = [];
    
	pg.connect(connectionString, function(err, client, done) {

	    var query = client.query("SELECT * FROM rehabilitant WHERE active = TRUE ORDER BY id ASC");
		
        query.on('row', function(row) {
            results.push(row);
        });

        query.on('end', function() {
            done();
            res.render('rehabilitants', { model: results });
        });
	});
});


var port = process.env.PORT || 5000;

http.listen(port, function(){
  console.log('Server is Online');
});


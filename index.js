
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var express  = require('express');
var expressHbs = require('express3-handlebars');
var bodyParser = require("body-parser");

var db = require('./database');

var devices = [];
for (var i=0 ; i<9; i++){
    devices.push(0);
}

var connectedDevices = 0;

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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
})); 

var connectionString = process.env.DATABASE_URL;
db.Init(connectionString);


app.get('/ready', function(req, res){
    res.render('ready');
});

app.get('/nulmeting', function(req, res){
    res.render('nulmeting');
});

app.get('/map', function(req, res){
    res.render('map');
});

app.get('/', function(req, res){
    res.render('splash', {layout: null});
});

app.get('/login', function(req, res){
    db.GetTrainers(function(trainers){
        res.render('login', { trainers: trainers, test: 1});
    });
});

app.post('/loginRequest', function(req, res){
    var trainerId = req.body.trainerId;
    var trainerPassword = req.body.password;
    
    db.ValidateLogin(trainerId, trainerPassword, function(valid){
        if(!valid){
            return res.send({valid: false, message: "Password incorrect!"});
        }else{
            return res.send({valid: true, message:"Correct!", redirect: "/rehabilitants"});
        }
    });
});

io.on('connection', function(socket){
	socket.on('requestID', function(){
		console.log("ID is requested");
        connectedDevices++;
        devices.push(connectedDevices);

        var i =0;
        while(i == devices[i]){
            i++;
        }
        devices[i] = i;

		var id_num = devices[i]; // ID van device
        var firstname = "Maikel";
		io.emit("receiveID", { device_id: id_num, user_id: firstname});

        console.log(devices[0] + ", " + devices[1] + ", " + devices[2] + ", " + devices[3] + ", " + devices[4] + ", " + devices[5] + ", " + devices[6] + ", " + devices[7] + ", " +devices[8]);
	})

    socket.on("userClosedApp", function(data){
        console.log("user closed the app ");
        var remove_id = parseInt(data.remove_id);
        devices[remove_id] =0;
    })

    socket.on("pressedStart", function(data){
        io.emit("startGame");
    })

    socket.on("updateWaterpas", function(data){
        io.emit("waterpas", data);
        console.log(data);
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

app.get('/rehabilitants', function(req, res){
    db.GetRehabilitants(function(rehabilitants){
        res.render('rehabilitants', { model: rehabilitants });
    });
});


var port = process.env.PORT || 5000;

http.listen(port, function(){
  console.log('Server is Online');
});


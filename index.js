
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var express  = require('express');
var expressHbs = require('express3-handlebars');
var bodyParser = require("body-parser");
var session = require('express-session')

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

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

var connectionString = 'postgres://wwrrqmxvkcxlqc:-1-0qme7DQUKoZ8BzHd0GrTzqK@ec2-54-204-6-113.compute-1.amazonaws.com:5432/d7u84okn0tjfn1?ssl=true';
db.Init(connectionString);


app.get('/ready', checkAuth, function(req, res){
    res.render('ready');
});

app.get('/nulmeting', checkAuth,function(req, res){
    res.render('nulmeting');
});

app.get('/map', checkAuth, function(req, res){
    res.render('map');
});

app.get('/', function(req, res){
    res.render('splash', {layout: null});
});

app.get('/login', function(req, res){
    if (!req.session.user_id) {
        db.GetTrainers(function(trainers){
            res.render('login', { trainers: trainers, test: 1});
        });
    }else{
        res.redirect('/rehabilitants');
    }
});

app.get('/logout', function (req, res) {
    delete req.session.user_id;
    res.redirect('/login');
});    

app.post('/loginRequest', function(req, res){
    var trainerId = req.body.trainerId;
    var trainerPassword = req.body.password;
    
    db.ValidateLogin(trainerId, trainerPassword, function(valid){
        if(!valid){
            return res.send({valid: false, message: "Password incorrect!"});
        }else{
            req.session.user_id = trainerId;
            return res.send({valid: true, message:"Correct!", redirect: "/rehabilitants"});
        }
    });
});

app.get('/rehabilitants', checkAuth, function(req, res){
    db.GetRehabilitants(function(rehabilitants){
        res.render('rehabilitants', { model: rehabilitants });
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


var port = process.env.PORT || 5000;

http.listen(port, function(){
  console.log('Server is Online');
});

function checkAuth(req, res, next) {
    if (!req.session.user_id) {
        //res.statusCode = 403; //forbidden
        //res.header('Location', '/login');
        //res.end('Not authorized');
        res.redirect('/login');
    } else {
        res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        next();
    }
}
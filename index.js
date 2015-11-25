
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

//var connectionString = process.env.DATABASE_URL
var connectionString = 'postgres://wwrrqmxvkcxlqc:-1-0qme7DQUKoZ8BzHd0GrTzqK@ec2-54-204-6-113.compute-1.amazonaws.com:5432/d7u84okn0tjfn1?ssl=true'
//var connectionString = 'postgres://localhost:5432/Geert';
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

db.Init(connectionString);


app.get('/ready', checkAuth, function(req, res){
    res.render('ready');
});

app.get('/group-overview', checkAuth, function(req, res){
    db.GetGroups(function(groups){
        res.render('group-overview',{ groups: groups });
    });
});

app.get('/add_person', function(req, res){
    res.render('add_person');
});

app.get('/overview', checkAuth, function(req, res){
    var groupId = req.query.group_id;
    var trainerId = req.session.user_id;
    
    if(!req.session.game_id){
        db.CreateNewGame(trainerId, function(game){
            req.session.game_id = game.id;
            load(game);
        });
    }else{
        db.GetGame(req.session.game_id, function(game){
            load(game);
        });
    }
    
    function load(game){
        db.GetRehabilitantGroup(groupId, function(rehabilitants){
            res.render('overview', { 
                rehabilitants: rehabilitants,
                game: game//{connectedDevices: [{id:1},{id:2}]}
            });
        });
    }
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
            res.render('login', { trainers: trainers, layout:null});
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
            return res.send({valid: true, message:"Correct!", redirect: "/group-overview"});
        }
    });
});

app.get('/rehabilitants', checkAuth, function(req, res){
    db.GetRehabilitants(function(rehabilitants){
        res.render('rehabilitants', { model: rehabilitants });
    });
});

app.get('/map_v2', checkAuth, function(req, res){
    res.render('map_v2');
});

io.on('connection', function(socket){
	socket.on('requestID', function(){
        //TODO: hoe weet je hier met welk device je praat? Als je hieronder io.emit() doet dan stuur je een device_id naar ALLE socket clients
        //TODO: gameId staat nu op eerst gevonden game. Echter, de unity client moet de mogelijkheid hebben om de verschillende games te bekijken 
        // en er 1 te selecteren
        
        db.GetGame(null, function(game){
            var gameId = game.id; 
           
            db.NewConnectedDevice(gameId, function(connectedDevice){
                io.emit("receiveID", { device_id: connectedDevice.id, user_id: ''});
                io.sockets.emit("newDeviceConnected", connectedDevice.id);
            });
        });
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
		console.log('disconnect');
	});

});



var port = process.env.PORT || 5000;

http.listen(port, function(){
  console.log('Server is Online');
});

function checkAuth(req, res, next) {
    //TODO: remove de regel hier onder
    //return next();
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

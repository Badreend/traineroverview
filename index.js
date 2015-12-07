
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var express  = require('express');
var expressHbs = require('express3-handlebars');
var bodyParser = require("body-parser");
var session = require('express-session')
var multer  = require('multer')
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/public/uploads')
    },
    filename: function (req, file, cb) { 
        cb(null, file.fieldname + '-' + Date.now() + '.' + file.mimetype.replace('image/','').replace('+xml', ''))
    }
})
var upload = multer({ 
    //dest: 'public/uploads/',
    storage: storage
}).single('avatar')

var db = require('./database');

var hbs = expressHbs.create({
    helpers: {
        json: function(context) {
            return JSON.stringify(context);
        },
        hasGame: function(options) {
            if(!this._locals.gameId){
                return options.inverse(this);
            }else{
                return options.fn(this);
            } 
        },
        notIn: function(context, options){
            var contains = false;
            context.forEach(function(element) {
                if(element.rehabilitant.id == this.id){
                    contains = true;
                }
            }, this);
            
            if(contains){
                return options.inverse(this);
            }else{
                return options.fn(this);
            } 
        }
    },
    layoutsDir: 'views/layouts/',
    defaultLayout: 'main_layout.html',
    partialsDir: 'views/partials/',
    extname: '.html'
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


app.get('/test', checkAuth, function(req, res){
    res.render('test');
});

app.get('/group-overview', checkAuth, function(req, res){
    db.GetGroups(function(groups){
        res.render('group-overview',{ groups: groups });
        //res.render('group-overview',{ groups: null });
    });
});


app.get('/rehabilitant', checkAuth, function(req, res){
    var rehabilitantId = req.query.id;
    
    if(rehabilitantId != null){
        db.GetRehabilitant(rehabilitantId, function(rehabilitant){
            //res.render('rehabilitant', {rehabilitant:null, layout: null});
            res.render('rehabilitant', {rehabilitant:rehabilitant, layout: null});
        });
    }else{
        res.render('rehabilitant', {layout: null});
    }
});

app.post('/add_rehabilitant', checkAuth, function(req, res){
    var rehabilitant = req.body;
    
    db.NewRehabilitant(rehabilitant, function(id){
        //res.redirect('/rehabilitant?id=' + id);
        res.redirect('back');
    });
});

app.post('/update_rehabilitant', checkAuth, function(req, res){
    var rehabilitant = req.body;
    
    db.UpdateRehabilitant(rehabilitant, function(id){
        //res.redirect('/rehabilitant?id=' + id);
        res.redirect('back');
     });
});

app.get('/group-activity', checkAuth, function(req, res){
    var groupId = req.query.group_id;
    
    if(!groupId){
        return res.redirect('/group-overview');
    }
    
    res.cookie('currentGroup', groupId);
    
    db.GetRehabilitantsInGroup(groupId, function(rehabilitants){
        res.render('group-activity', { 
            groupId: groupId, 
            groupname: 'test', 
            rehabilitants: rehabilitants
        });
    });
    
});

app.get('/overview', checkAuth, function(req, res){
    var groupId = req.query.group_id;
    var trainerId = req.session.user_id;
    
    if(res.locals.gameId){
        db.GetTrainerGame(trainerId, function(game){
            load(game);
        });
    }else{
        db.CreateNewGame(trainerId, function(game){
            load(game);
        });
    }
    
    function load(game){
        db.GetRehabilitantsInGroup(groupId, function(rehabilitants){
            res.render('overview', {
                groupname: 'test',
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

app.get('/unavailable', function(req, res){
    res.render('unavailable', {layout:null});
});

app.get('/login', function(req, res){
    if (!req.session.user_id) {
        db.GetTrainers(function(trainers){
            res.render('login', {trainers: trainers, layout:null});
            //res.render('login', { trainers: [{id:1, firstName:'maikel', lastName: 'bla', pictureUrl:'https://s-media-cache-ak0.pinimg.com/736x/d1/a6/64/d1a664bca214bf785a293cbc87950fc4.jpg'}], layout:null});
        });
    }else{
        res.redirect('/group-overview');
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
            res.locals.trainerId = trainerId;
            res.clearCookie('currentGroup');
            return res.send({valid: true, message:"Correct!", redirect: "/group-overview"});
        }
    });
});

app.post('/upload', function(req, res){
    upload(req, res, function (err) {
        res.send({err: err, path: '/uploads/' + req.file.filename});
    });
});

app.post('/pair_devices', function(req, res){
    var devices = req.body.device;
    
    db.PairDevices(devices, function(){
        io.emit("startGame");
        res.redirect('/map_v2');
    });
});

app.get('/map_v2', checkAuth, function(req, res){
    var gameId = res.locals.gameId;
    
    db.GetGameStates(gameId, function(connectedDevices){
        res.render('map_v2', { connectedDevices: connectedDevices, gameId: gameId });
    });
});

app.get('/eva', checkAuth, function(req, res){
    var gameId = res.locals.gameId;
    
    db.GetGameStates(gameId, function(connectedDevices){
        res.render('eva', { connectedDevices: connectedDevices });
    });
});

app.post('/exit_game', checkAuth, function(req, res){
    var gameId = req.body.gameId;
    var groupId = req.body.groupId;
    
    //TODO: handle connected devices. Should they be inactive? Receive a warning?
    db.ExitGame(gameId, function(exitGames){
        res.redirect('/group-activity?group_id='+groupId);
    });
    
});

app.post('/new_game', checkAuth, function(req, res){
    var trainerId = req.session.user_id;
    
    db.CreateNewGame(trainerId, function(game){
        res.send({gameId: game.id});
    });
});

io.on('connection', function(socket){
    socket.on('getActiveGames', function(data){
        if(!data.unityId)
            return;
            
        db.GetActiveGames(function(games){
            io.emit('receiveActiveGames', {unityId: data.unityId, games: games});
        });
    });
    
	socket.on('requestID', function(data){
        if(!data.unityId || !data.trainerId)
            return;
            
        db.GetTrainerGame(data.trainerId, function(game){
        
            db.NewConnectedDevice(game.id, function(connectedDevice){
                io.emit("receiveID", { unityId: data.unityId, device_id: connectedDevice.id });
                io.sockets.emit("newDeviceConnected", connectedDevice.id);
            });
        });
	});

    socket.on("userClosedApp", function(data){
        console.log("user closed the app ");
        db.RemoveConnectedDevice(data.remove_id);
        io.sockets.emit("deviceDisconnected", data.remove_id);
    });
    
    socket.on("userPausedApp", function(data){
        db.PauseConnectedDevice(data.deviceId, data.pause);
    });

    socket.on("pressedStart", function(data){
        io.emit("startGame");
    });

    socket.on("updateWaterpas", function(data){
        io.emit("waterpas", data);
        console.log(data);
    });

	socket.on("dataTransfer", function(data){
		//console.log(data);
		io.sockets.emit("dataClient",data);
	});



 //    function dataClientTest(){
 //        var devices = [];
 //        //fill devices[]
 //        for(var i = 0; i < 4;i++){
 //           var device = {device_id:i,x:52.033518,y:5.337378,heartrate:120};
 //            devices.push(device);
 //        }
 //        for(var i = 0; i < devices.length; i++){
 //            io.sockets.emit("dataClient",devices[i]);
 //        }
 //    }
	// setTimeout(dataClientTest, 3000);

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
        res.locals.trainerId = req.session.user_id;
        res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        
        db.GetTrainerGame(req.session.user_id, function(game){
            if(game.id != 0){
                res.locals.gameId = game.id;
            }
            next();
        });
        
    }
}

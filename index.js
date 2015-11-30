
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
//var connectionString = 'postgres://wwrrqmxvkcxlqc:-1-0qme7DQUKoZ8BzHd0GrTzqK@ec2-54-204-6-113.compute-1.amazonaws.com:5432/d7u84okn0tjfn1?ssl=true'
var connectionString = 'postgres://localhost:5432/Geert';
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
    });
});


app.get('/rehabilitant', checkAuth, function(req, res){
    var rehabilitantId = req.query.id;
    
    if(rehabilitantId != null){
        db.GetRehabilitant(rehabilitantId, function(rehabilitant){
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
    var gameId = req.session.game_id;
    res.cookie('currentGroup', groupId);
    
    db.GetRehabilitantsInGroup(groupId, function(rehabilitants){
        res.render('group-activity', { 
            groupId: groupId, 
            groupname: 'test', 
            rehabilitants: rehabilitants,
            gameId: gameId
        });
    });
    
});

app.get('/overview', checkAuth, function(req, res){
    var groupId = req.query.group_id;
    var trainerId = req.session.user_id;
    
    if(!req.session.game_id){
        db.CreateNewGame(trainerId, function(game){
            req.session.game_id = game.id;
            res.cookie('gameBusy','true');
            load(game);
        });
    }else{
        db.GetGame(req.session.game_id, function(game){
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
    delete req.session.game_id;
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
            delete req.session.game_id;
            res.clearCookie('gameBusy');
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

app.get('/map_v2', checkAuth, function(req, res){
    var gameId = req.session.game_id;
    
    if(gameId == null){
        return res.redirect('/group-overview');
    }
    
    db.GetFullGame(gameId, function(connectedDevices){
        res.render('map_v2', { connectedDevices: connectedDevices });
    });
});

app.get('/exit_game', checkAuth, function(req, res){
    var gameId = req.query.id;
    
    if(gameId){
        db.ExitGame(gameId, function(){
            delete req.session.game_id;
            res.clearCookie('gameBusy');
            res.redirect('/group-overview');
        });
    }else{
        res.redirect('/group-overview');
    }
    
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
        db.RemoveConnectedDevice(data.remove_id);
        io.sockets.emit("deviceDisconnected", data.remove_id);
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
        res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        next();
    }
}

var pg = require('pg');
var Trainer = require('./models/trainer')
var Group = require('./models/group')
var Rehabilitant = require('./models/rehabilitant')
var Game = require('./models/game')
var ConnectedDevice = require('./models/connectedDevice')

module.exports = {
    connectionString: null,
    
    Init: function(connectionString){
        this.connectionString = connectionString;
    },
    
    GetRehabilitants: function(callback){
        var results = [];
        
        pg.connect(this.connectionString, function(err, client, done) {
            var query = client.query("SELECT * FROM rehabilitant WHERE active = TRUE ORDER BY id ASC");
            
            query.on('row', function(row) {
                results.push(row);
            });
    
            query.on('end', function() {
                done();
                callback(results);
            });
        });
    },
    
    GetRehabilitantGroup: function(groupId, callback){
        var results = [];
        
        pg.connect(this.connectionString, function(err, client, done) {
            var query = client.query(
                "SELECT r.* " +
                "FROM \"group\" g " +
                "INNER JOIN group_rehabilitant gr ON gr.group_id = g.id " +
                "INNER JOIN rehabilitant r ON r.id = gr.rehabilitant_id " +
                "WHERE g.id = " + groupId);
            
            query.on('row', function(row) {
                var rehabilitant = new Rehabilitant();
                Map(rehabilitant, row);
                
                results.push(rehabilitant);
            });
    
            query.on('end', function() {
                done();
                callback(results);
            });
        });
    },
    
    GetTrainers: function(callback){
        var results = [];
        pg.connect(this.connectionString, function(err, client, done) {
            var query = client.query("SELECT * FROM trainer WHERE active = TRUE ORDER BY id ASC");
            
            query.on('row', function(row) {
                var trainer = new Trainer();
                Map(trainer, row);
                
                results.push(trainer);
            });
    
            query.on('end', function() {
                done();
                callback(results);
            });
        });
    },
    
    ValidateLogin: function(trainerId, trainerPassword, callback){
        var results = [];
        
        pg.connect(this.connectionString, function(err, client, done) {
            var query = client.query("SELECT password FROM trainer WHERE id = " + trainerId);
            
            query.on('row', function(row) {
                results.push(row);
            });
    
            query.on('end', function() {
                done();
                var valid = results[0].password == trainerPassword;
                callback(valid);
            });
        });
    },
    
    GetGroups: function(callback){
        var results = [];
        
        pg.connect(this.connectionString, function(err, client, done) {
            var query = client.query("SELECT id, name, icon FROM \"group\" WHERE active = TRUE ORDER BY id");
            
            query.on('row', function(row) {
                var group = new Group();
                Map(group, row);
                
                results.push(group);
            });
    
            query.on('end', function() {
                done();
                callback(results);
            });
        });
    },
    
    CreateNewGame: function(trainerId, callback){
        pg.connect(this.connectionString, function(err, client, done) {
            var query = client.query(
                "INSERT INTO game(\"trainer_id\") " +
                "VALUES('"+trainerId+"') " +
                "RETURNING \"id\", \"start_date\", \"end_date\", \"trainer_id\";");
            
            var game = new Game();
            
            query.on('row', function(row) {
                Map(game, row);
            });
    
            query.on('end', function() {
                done();
                callback(game);
            });
        });
    },
    
    GetGame: function(gameId, callback){
        pg.connect(this.connectionString, function(err, client, done) {
            
            var gameSql = gameId != null
                ?   "SELECT g.id \"game_id\", t.* \
                    FROM game g \
                    INNER JOIN trainer t ON t.id = g.trainer_id \
                    WHERE g.id = " + gameId
                :   "SELECT g.id \"game_id\", t.* \
                    FROM game g \
                    INNER JOIN trainer t ON t.id = g.trainer_id \
                    ORDER BY g.id DESC \
                    LIMIT 1";
                    
            var query = client.query(gameSql);
 
            var game = new Game();
            var trainer = new Trainer();
            
            query.on('row', function(row) {
                Map(game, row, 'game_');
                Map(trainer, row);
            });
            
            query.on('end', function() {
                done();
                game.trainer = trainer;
               
                var q2 = client.query(
                    "SELECT cd.id \"connected_device_id\", r.* \
                    FROM game g \
                    INNER JOIN connected_device cd ON cd.game_id = g.id \
                    LEFT JOIN rehabilitant r ON r.id = cd.rehabilitant_id \
                    WHERE g.id = " + game.id);
                
                var connDevices = [];
                q2.on('row', function(row) {
                    var connectedDevice = new ConnectedDevice();
                    Map(connectedDevice, row, 'connected_device_');
                    var rehabilitant = new Rehabilitant();
                    Map(rehabilitant, row);
                    connectedDevice.rehabilitant = rehabilitant;
                    connDevices.push(connectedDevice);
                });
                
                q2.on('end', function() {
                    done();
                
                    game.connectedDevices = connDevices;
                    callback(game);
                });
            });
        });
    },
    
    NewConnectedDevice: function(gameId, callback){
        pg.connect(this.connectionString, function(err, client, done) {
            var query = client.query(
                "INSERT INTO connected_device(\"game_id\") " +
                "VALUES('"+gameId+"') " +
                "RETURNING \"id\", \"rehabilitant_id\", \"game_id\";");
            
            var connDevice = new ConnectedDevice();
            
            query.on('row', function(row) {
                Map(connDevice, row);
            });
    
            query.on('end', function() {
                done();
                callback(connDevice);
            });
        });
    }
};

function Map(obj1, obj2, prefix){
    for(var key in obj1){
        for(var key2 in obj2){
            if(prefix && key2.lastIndexOf(prefix, 0) !== 0) continue;
            var compareKey = prefix != null ? key2.toLowerCase().replace(prefix,'') : key2;
            
            if(key.toLowerCase().replace('_','') == compareKey.toLowerCase().replace('_','')){
                obj1[key] = obj2[key2];
            }
        }
    }
}

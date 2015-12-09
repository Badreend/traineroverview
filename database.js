var pg = require('pg');
var Trainer = require('./models/trainer')
var Group = require('./models/group')
var Rehabilitant = require('./models/rehabilitant')
var Game = require('./models/game')
var ConnectedDevice = require('./models/connectedDevice')
var RehabilitantState = require('./models/rehabilitantState')

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
    
    GetRehabilitant: function(id, callback){
        pg.connect(this.connectionString, function(err, client, done) {
            var query = client.query("SELECT * FROM rehabilitant WHERE id = " + id);
            
            var rehabilitant = new Rehabilitant();
            query.on('row', function(row) {
                //GL: wtf? dateOfBirth is off by one day, while the database contains correct date..
                Map(rehabilitant, row);

                rehabilitant.dateOfBirth = rehabilitant.dateOfBirth != null 
                    ? rehabilitant.dateOfBirth.addDays(1) 
                    : rehabilitant.dateOfBirth;
            });
    
            query.on('end', function() {
                done();
                callback(rehabilitant);
            });
        });
    },
    
    GetRehabilitantsInGroup: function(groupId, callback){
        var results = [];
        
        pg.connect(this.connectionString, function(err, client, done) {
            var query = client.query(
                "SELECT * \
                FROM rehabilitant \
                WHERE group_id = {0}".format(groupId));
            
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
                var valid = results[0].password == trainerPassword;
                
                done();
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
        this.ExitGame(trainerId, function(){});
        
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
    
    GetTrainerGame: function(trainerId, callback){
        pg.connect(this.connectionString, function(err, client, done) {
             
            var query = client.query(
                "SELECT g.id \"game_id\", t.* \
                 FROM game g \
                 INNER JOIN trainer t ON t.id = g.trainer_id \
                 WHERE g.active = TRUE \
                 AND g.trainer_id = " + trainerId + " \
                 ORDER BY game_id DESC \
                 LIMIT 1");
 
            var game = new Game();
            var trainer = new Trainer();
            
            query.on('row', function(row) {
                Map(game, row, 'game_');
                Map(trainer, row);
            });
            
            query.on('end', function() {
                game.trainer = trainer;
               
                var q2 = client.query(
                    "SELECT cd.id \"connected_device_id\", r.* \
                    FROM game g \
                    INNER JOIN connected_device cd ON cd.game_id = g.id \
                    LEFT JOIN rehabilitant r ON r.id = cd.rehabilitant_id \
                    WHERE g.id = {0} \
                    AND cd.active = TRUE".format(game.id));
                
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
                    game.connectedDevices = connDevices;
                    
                    done();
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
    },
    
    PauseConnectedDevice: function(deviceId, pause){
        pg.connect(this.connectionString, function(err, client, done){
           var query = client.query("UPDATE connected_device SET active = {0} WHERE id = {1}".format(!pause, deviceId));
           
           query.on('end', function(){
               done();
           });
        });
    },
    
    RemoveConnectedDevice: function(deviceId){
        pg.connect(this.connectionString, function(err, client, done){
           var query = client.query("DELETE FROM connected_device WHERE id = " + deviceId);
           
           query.on('end', function(){
               done();
           });
        });
    },
    
    GetGameStates: function(gameId, callback){
        //this.GetTrainerGame(trainerId, function(game){
            
            pg.connect(this.connectionString, function(err, client, done) {
                //var commaDelimitedDeviceIds = game.connectedDevices.map(function(device){ return device.id; }).join(",");
                
                var query = client.query(
                    "SELECT s.* \
                    FROM v_map_states s \
                    INNER JOIN connected_device cd ON cd.id = s.connected_device_id \
                    WHERE cd.game_id = {0} \
                    AND cd.active = TRUE".format(gameId));
                
                //var group = new Group();
                var connectedDevices = [];
                var rehabilitants = [];
                var states = [];
                
                query.on('row', function(row) {
                    var connectedDevice = new ConnectedDevice();
                    var rehabilitant = new Rehabilitant();
                    var rehabilitantState = new RehabilitantState();
                    
                    if(!IsInArray(connectedDevices, row.connected_device_id, "id")){
                        Map(connectedDevice, row, 'connected_device_');
                        connectedDevices.push(connectedDevice);
                    }
                    
                    if(!IsInArray(rehabilitants, row.rehabilitant_id, "id")){
                        Map(rehabilitant, row, 'rehabilitant_');
                        rehabilitants.push(rehabilitant);
                    }
                        
                    Map(rehabilitantState, row, 'state_');
                    states.push(rehabilitantState);
                });
                
                query.on('end', function(){
                    connectedDevices.forEach(function(device, index){
                        var rehabs = rehabilitants.filter(function(rehabilitant){
                            return rehabilitant.id == device.rehabilitant_id;
                        });
                        
                        if(rehabs.length > 0){
                            var rehabilitant = rehabs[0];
                            rehabilitant.states = states.filter(function(state){
                                return state.rehabilitant_id == rehabilitant.id;
                            });
                            
                            device.rehabilitant = rehabilitant;
                        }
                    });
                    done();
                    callback(connectedDevices);
                });
            });
        //});
    },
    
    NewRehabilitant: function(rehabilitant, callback){
        var newRehabilitant = new Rehabilitant();
        Map(newRehabilitant, rehabilitant);
        
        pg.connect(this.connectionString, function(err, client, done){
           var query = client.query(
               "INSERT INTO \"public\".\"rehabilitant\"( \
                \"first_name\" \
                , \"last_name\" \
                , \"picture_url\" \
                , \"active\" \
                , \"gender\" \
                , \"cluster\" \
                , \"diagnosis\" \
                , \"function\" \
                , \"goal\" \
                , \"min_heartrate\" \
                , \"max_heartrate\" \
                , \"course_duration\" \
                , \"date_of_birth\" \
                , \"group_id\") \
               VALUES( \
                '{0}' \
                , '{1}' \
                , '{2}' \
                , '1' \
                , '{3}' \
                , '{4}' \
                , '{5}' \
                , '{6}' \
                , '{7}' \
                , '{8}' \
                , '{9}' \
                , '{10}' \
                , '{11}' \
                , '{12}') \
               RETURNING \"id\", \"first_name\", \"last_name\", \"picture_url\", \"active\", \"gender\", \"cluster\", \"diagnosis\", \"function\", \"goal\", \"min_heartrate\", \"max_heartrate\", \"course_duration\";"     
            .format(newRehabilitant.firstName, newRehabilitant.lastName, newRehabilitant.pictureUrl, newRehabilitant.gender, newRehabilitant.cluster, newRehabilitant.diagnosis, newRehabilitant.function,
                newRehabilitant.goal, newRehabilitant.minHeartRate, newRehabilitant.maxHeartRate, newRehabilitant.courseDuration, newRehabilitant.dateOfBirth, newRehabilitant.groupId));
           
           var insertedId;
           query.on('row', function(row){
               insertedId = row.id;
           });
           
           query.on('end', function(){
               done();
               callback(insertedId);
           });
        });
    },
    
    UpdateRehabilitant: function(rehabilitant, callback){
        var updateRehab = new Rehabilitant();
        Map(updateRehab, rehabilitant);
        
        pg.connect(this.connectionString, function(err, client, done){
           var query = client.query(
               "UPDATE \"public\".\"rehabilitant\" \
                SET \"first_name\"='{0}' \
                , \"last_name\"='{1}' \
                , \"picture_url\"='{2}' \
                , \"active\"='1' \
                , \"gender\"='{3}' \
                , \"cluster\"='{4}' \
                , \"diagnosis\"='{5}' \
                , \"function\"='{6}' \
                , \"goal\"='{7}' \
                , \"min_heartrate\"='{8}' \
                , \"max_heartrate\"='{9}' \
                , \"course_duration\"='{10}' \
                , \"date_of_birth\"='{11}' \
                , \"group_id\"='{12}' \
                WHERE \"id\"='{13}' \
                RETURNING \"id\", \"first_name\", \"last_name\", \"picture_url\", \"active\", \"gender\", \"cluster\", \"diagnosis\", \"function\", \"goal\", \"min_heartrate\", \"max_heartrate\", \"course_duration\";"     
            .format(updateRehab.firstName, updateRehab.lastName, updateRehab.pictureUrl, updateRehab.gender, updateRehab.cluster, updateRehab.diagnosis, updateRehab.function,
                updateRehab.goal, updateRehab.minHeartRate, updateRehab.maxHeartRate, updateRehab.courseDuration, updateRehab.dateOfBirth, updateRehab.groupId, updateRehab.id));
           
           var updatedId;
           query.on('row', function(row){
               updatedId = row.id;
           });
           
           query.on('end', function(){
               done();
               callback(updatedId);
           });
        });
    },
    
    ExitGame: function(gameId, callback){
        pg.connect(this.connectionString, function(err, client, done){
           var query = client.query(
               "UPDATE game \
                SET active = FALSE \
                ,end_date = now() \
                WHERE id = {0} \
                RETURNING id".format(gameId));
           
           var gameIds = [];
           query.on('row', function(row){
               gameIds.push(row);
           });
           
           query.on('end', function(){
               done();
               callback(gameIds);
           });
        });
    },
    
    PairDevices: function(devices, callback){
        pg.connect(this.connectionString, function(err, client, done){
            var counter = 0;
            devices.forEach(function(device) {
                var query = client.query(
                    "UPDATE connected_device SET rehabilitant_id = {0} WHERE id = {1}"
                    .format(device.rehabilitant_id != null ? device.rehabilitant_id : 'NULL', device.id));
                
                query.on('end', function(){
                    counter++;
                    if(counter == devices.length){
                        done();
                        callback();
                    }
                });
            });
        });
    },
    
    GetActiveGames: function(callback){
        pg.connect(this.connectionString, function(err, client, done){

            var query = client.query(
                "SELECT g.id \"game_id\" \
                 , g.start_date \"game_start_date\" \
                 , t.id \"trainer_id\" \
                 , t.first_name \"trainer_first_name\" \
                 , t.last_name \"trainer_last_name\" \
                 FROM game g \
                 INNER JOIN trainer t ON t.id = g.trainer_id \
                 WHERE g.active = TRUE");
            
            var games = [];
            query.on('row', function(row){
                var game = new Game();
                var trainer = new Trainer();
                Map(game, row, 'game_');
                Map(trainer, row, 'trainer_');
                
                game.trainer = trainer;
                games.push(game);
            });
            
            query.on('end', function(){
                done();
                callback(games);    
            });
        });
    },
    
    InsertGameState: function(data){
        pg.connect(this.connectionString, function(err, client, done){
            var gameState = new RehabilitantState();
            Map(gameState, data);
            var deviceId = data.device_id;
            
            if(deviceId != null){
                var query = client.query(
                    "INSERT INTO rehabilitant_state(\"game_id\", \"rehabilitant_id\", \"heart_rate\", \"gps_lat\", \"gps_lon\", \"map_x\", \"map_y\") \
                    SELECT \"game_id\", \"rehabilitant_id\", '{0}', '{1}', '{2}', '{3}', '{4}' \
                    FROM connected_device \
                    WHERE id = {5}".format(gameState.heartRate, gameState.gpsLat, gameState.gpsLon, gameState.mapX, gameState.mapY, deviceId));
            
                query.on('end', function(){
                    done();
                });
            }else{
                done();
            }
        });
    }
};

function Map(obj1, obj2, prefix){
    for(var key in obj1){
        for(var key2 in obj2){
            if(prefix && key2.lastIndexOf(prefix, 0) !== 0) continue;
            var compareKey = prefix != null ? key2.toLowerCase().replace(prefix,'') : key2;
            
            if(key.toLowerCase().replace(/_/g,'') == compareKey.toLowerCase().replace(/_/g,'')){
                obj1[key] = obj2[key2];
            }
        }
    }
}

if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) { 
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

function IsInArray(arr, prop, key){
    for(var i=0; i<arr.length; i++){
        if(arr[i][key] == prop)
            return true;
    }
    return false;
}
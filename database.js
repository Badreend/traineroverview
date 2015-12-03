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
    },
    
    RemoveConnectedDevice: function(deviceId){
        pg.connect(this.connectionString, function(err, client, done){
           var query = client.query("DELETE FROM connected_device WHERE id = " + deviceId);
           
           query.on('end', function(){
               done();
           });
        });
    },
    
    GetFullGame: function(gameId, callback){
        this.GetGame(gameId, function(game){
            if(game.connectedDevices.length == 0){
                return callback(game.connectedDevices);
            }
            
            pg.connect(this.connectionString, function(err, client, done) {
                var commaDelimitedDeviceIds = game.connectedDevices.map(function(device){ return device.id; }).join(",");
                
                var query = client.query(
                    "SELECT * \
                    FROM v_map_states \
                    WHERE connected_device_id IN (" + commaDelimitedDeviceIds + ")");
                
                //var group = new Group();
                var connectedDevices = [];
                var rehabilitants = [];
                var states = [];
                
                query.on('row', function(row) {
                    var connectedDevice = new ConnectedDevice();
                    var rehabilitant = new Rehabilitant();
                    var rehabilitantState = new RehabilitantState();
                    
                    Map(connectedDevice, row, 'connected_device_');
                    Map(rehabilitant, row, 'rehabilitant_');
                    Map(rehabilitantState, row, 'state_');
                    
                    connectedDevices.push(connectedDevice);
                    rehabilitants.push(rehabilitant);
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
        });
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
                , \"date_of_birth\") \
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
                , '{11}') \
               RETURNING \"id\", \"first_name\", \"last_name\", \"picture_url\", \"active\", \"gender\", \"cluster\", \"diagnosis\", \"function\", \"goal\", \"min_heartrate\", \"max_heartrate\", \"course_duration\";"     
            .format(newRehabilitant.firstName, newRehabilitant.lastName, newRehabilitant.pictureUrl, newRehabilitant.gender, newRehabilitant.cluster, newRehabilitant.diagnosis, newRehabilitant.function,
                newRehabilitant.goal, newRehabilitant.minHeartRate, newRehabilitant.maxHeartRate, newRehabilitant.courseDuration, newRehabilitant.dateOfBirth));
           
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
                WHERE \"id\"='{12}' \
                RETURNING \"id\", \"first_name\", \"last_name\", \"picture_url\", \"active\", \"gender\", \"cluster\", \"diagnosis\", \"function\", \"goal\", \"min_heartrate\", \"max_heartrate\", \"course_duration\";"     
            .format(updateRehab.firstName, updateRehab.lastName, updateRehab.pictureUrl, updateRehab.gender, updateRehab.cluster, updateRehab.diagnosis, updateRehab.function,
                updateRehab.goal, updateRehab.minHeartRate, updateRehab.maxHeartRate, updateRehab.courseDuration, updateRehab.dateOfBirth, updateRehab.id));
           
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
           var query = client.query("UPDATE game SET active = FALSE WHERE id = " + gameId);
           
           query.on('end', function(){
               done();
               callback();
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
                    done();
                    counter++;
                    if(counter == devices.length)
                        callback();
                });
            });
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
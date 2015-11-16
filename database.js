var pg = require('pg');
var Trainer = require('./models/trainer')

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
    }
};

function Map(obj1, obj2){
    for(var key in obj1){
        for(var key2 in obj2){
            if(key.toLowerCase().replace('_','') == key2.toLowerCase().replace('_','')){
                obj1[key] = obj2[key2];
            }
        }
    }
}

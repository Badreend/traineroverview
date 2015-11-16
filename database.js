var pg = require('pg');

module.exports = {
    connectionString: null,
    
    Init: function(connectionString){
        this.connectionString = connectionString;
    },
    
    GetRehabilitants: function(){
        var results = [];
        
        pg.connect(this.connectionString, function(err, client, done) {
            var query = client.query("SELECT * FROM rehabilitant WHERE active = TRUE ORDER BY id ASC");
            
            query.on('row', function(row) {
                results.push(row);
            });
    
            query.on('end', function() {
                done();
                return results;
            });
        });
    },
    
    GetTrainers: function(){
        var results = [];
        
        pg.connect(this.connectionString, function(err, client, done) {
            var query = client.query("SELECT * FROM rehabilitant WHERE active = TRUE ORDER BY id ASC");
            
            query.on('row', function(row) {
                results.push(row);
            });
    
            query.on('end', function() {
                done();
                return results;
            });
        });
    }
};

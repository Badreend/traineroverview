
var RehabilitantState = function(){
	this.id = 0;
	//this.game = new Game();
	//this.rehabilitant = new Rehabilitant();
	this.game_id = 0;
	this.rehabilitant_id = 0;
	this.heartRate = 0;
	this.heartRateLevel = 0;
	this.gpsLat = 0.0;
	this.gpsLon = 0.0;
	this.x = 0.0;
	this.y = 0.0;
	this.state = '';
	this.timestamp = new Date();
}

module.exports = RehabilitantState;
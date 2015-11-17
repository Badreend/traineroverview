var Rehabilitant = function(){
	this.id;
	this.firstName = '';
	this.lastName = '';
	this.pictureUrl = '';
	this.active = true;
	this.note = '';
	this.heartRate = 0;
	this.heartRateLevel = 0;
	this.states = new Array<RehabilitantState>();
};

Rehabilitant.prototype.GetFullName = function(){
	return this.firstName + ' ' + this.lastName;
}

Rehabilitant.prototype.GetCurrentHeartRate = function(){
	for(var i=0; i<this.states.length; i++){
		
	}
}

var RehabilitantState = function(){
	this.id;
	this.game = new Game();
	this.rehabilitant = new Rehabilitant();
	this.heartRate = 0;
	this.heartRateLevel = 0;
	this.gpsLat = 0.0;
	this.gpsLon = 0.0;
	this.mapX = 0;
	this.mapY = 0;
	this.state = '';
	this.timestamp = new Date();
}
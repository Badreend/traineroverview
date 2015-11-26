var Game = require('./game')

var Rehabilitant = function(){
	this.id = 0;
	this.firstName = '';
	this.lastName = '';
	this.pictureUrl = '';
	this.active = true;
	this.note = '';
	this.heartRate = 0;
	this.heartRateLevel = 0;
	this.states = [];
};

Rehabilitant.prototype.GetFullName = function(){
	return this.firstName + ' ' + this.lastName;
}

Rehabilitant.prototype.GetCurrentHeartRate = function(){
	for(var i=0; i<this.states.length; i++){
		
	}
}


module.exports = Rehabilitant;
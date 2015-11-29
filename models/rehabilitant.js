var Game = require('./game')

var Rehabilitant = function(){
	this.id = 0;
	this.firstName = '';
	this.lastName = '';
	this.pictureUrl = '';
	this.active = true;
	this.diagnosis = '';
	this.heartRate = 0;
	this.heartRateLevel = 0;
	this.states = [];
	this.minHeartRate = 0;
	this.maxHeartRate = 0;
	this.gender = '';
	this.cluster = 0;
	this.function = '';
	this.goal = '';
	this.courseDuration = 0;
	this.dateOfBirth = new Date();
};

Rehabilitant.prototype.GetFullName = function(){
	return this.firstName + ' ' + this.lastName;
}

Rehabilitant.prototype.GetCurrentHeartRate = function(){
	for(var i=0; i<this.states.length; i++){
		
	}
}

Rehabilitant.prototype.IsMale = function(){
	return this.gender == 'M';
}

Rehabilitant.prototype.IsFemale = function(){
	return this.gender == 'F';
}

Rehabilitant.prototype.DurationShort = function(){
	return this.courseDuration == 8;
}

Rehabilitant.prototype.DurationLong = function(){
	return this.courseDuration == 15;
}

Date.prototype.toString = function(){
	return this.toISOString().substring(0, 10);
}

Date.prototype.addDays = function(days)
{
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}

module.exports = Rehabilitant;
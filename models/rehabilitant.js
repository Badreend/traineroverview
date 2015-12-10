var Game = require('./game')

var Rehabilitant = function(){
	var context = this;
	this.id = 0;
	this.firstName = '';
	this.lastName = '';
	this.pictureUrl = '';
	this.active = true;
	this.diagnosis = '';
	this.heartRate = 0;
	this.heartRateLevel = 0;
	//this.evaStates = [];
	this.minHeartRate = 0;
	this.maxHeartRate = 0;
	this.gender = '';
	this.cluster = 0;
	this.function = '';
	this.goal = '';
	this.courseDuration = 0;
	this.dateOfBirth = new Date();
	this.groupId = 0;
	
	this.GetFullName = function(){
		return context.firstName + ' ' + context.lastName;
	};
	
	this.IsMale = function(){
		return context.gender == 'M';
	};

	this.IsFemale = function(){
		return context.gender == 'F';
	};

	this.DurationShort = function(){
		return context.courseDuration == 8;
	};
	
	this.DurationLong = function(){
		return context.courseDuration == 15;
	};
	
};


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
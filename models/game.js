var Trainer = require('./trainer')

var Game = function(){
	this.id = 0;
	this.startDate = new Date();
	this.endDate = new Date();
	this.trainer = new Trainer();
	this.connectedDevices = [];
}

Game.prototype.ToString = function(){
	return this.id + ': ' + this.startDate + ' - ' + this.endDate;
}

module.exports = Game;
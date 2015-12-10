var Rehabilitant = require('./rehabilitant')

var ConnectedDevice = function(){
	this.id = 0;
	this.rehabilitant = new Rehabilitant();
	this.rehabilitant_id = 0;
	this.game_id = 0;
	this.states = [];
}

ConnectedDevice.prototype.ToString = function(){
	return this.id + ': ' + this.rehabilitant.GetFullName();
}

module.exports = ConnectedDevice;
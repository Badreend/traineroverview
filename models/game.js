var Game = function(){
	this.id;
	this.startDate = new Date();
	this.endDate = new Date();
	this.trainer = new Trainer();
	this.connectedDevices = new Array<ConnectedDevice>();
}

Game.prototype.ToString = function(){
	return this.id + ': ' + this.startDate + ' - ' + this.endDate;
}

var ConnectedDevice = function(){
	this.id;
	this.rehabilitant = new Rehabilitant();
	this.game = new Game();
}

ConnectedDevice.prototype.ToString = function(){
	return this.id + ': ' + this.rehabilitant.GetFullName();
}
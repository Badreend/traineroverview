var Trainer = require('./trainer')
var df = require('dateformat');

var Game = function(){
	var context = this;
	this.id = 0;
	this.startDate = new Date();
	this.endDate = new Date();
	this.trainer = new Trainer();
	this.connectedDevices = [];
	
	this.toString = function(){
		/*var timeDiff = Math.abs(context.startDate.getTime() - context.endDate.getTime());
		var hours = Math.floor(((timeDiff / 1000) / 60) / 60);
		var minutes = Math.floor(((timeDiff / 1000) / 60) % 60);*/
		return 'Sessie: ' + df(context.startDate,'dd-mm-yyyy hh:MM') + ' tot ' + df(context.endDate,'hh:MM');
	};
}


module.exports = Game;

var ConnectedDeviceState = function(){
	this.connectedDeviceId = 0;
	this.heartRate = 0;
	this.gpsLat = 0.0;
	this.gpsLon = 0.0;
	this.x = 0.0;
	this.y = 0.0;
	this.timestamp = new Date();
}

module.exports = ConnectedDeviceState;
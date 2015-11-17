var Trainer = function(){
	this.id = 0;
	this.firstName = '';
	this.lastName = '';
	this.password = '';
	this.active = true;
	this.pictureUrl = '';
}

Trainer.prototype.GetFullName = function(){
	return this.firstName + ' ' + this.lastName;
}

module.exports = Trainer;
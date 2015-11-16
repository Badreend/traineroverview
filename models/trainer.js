var Trainer = function(){
	this.id;
	this.firstName = '';
	this.lastName = '';
	this.password = '';
	this.active = true;
	this.pictureUrl = '';
}

Trainer.prototype.GetFullName = function(){
	return this.firstName + ' ' + this.lastName;
}
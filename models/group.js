var Group = function(){
	this.id = 0;
	this.name = '';
	this.active = true;
	this.icon = '';
	this.rehabilitants = [];
}

Group.prototype.NumRehabilitants = function(){
	return this.rehabilitants.length;
}

Group.prototype.GetIcon = function(){
	return this.icon || 'imgs/shared/portraitFrame.png';
}

module.exports = Group;
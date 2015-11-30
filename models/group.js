var Group = function(){
	var context = this;
	this.id = 0;
	this.name = '';
	this.active = true;
	this.icon = '';
	this.rehabilitants = [];
	
	this.NumRehabilitants = function(){
		return context.rehabilitants.length;
	};
	
	this.GetIcon = function(){
		return context.icon || 'imgs/shared/portraitFrame.png';
	};
}

module.exports = Group;
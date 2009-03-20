/*
Script: Editable.DefaultText.js
	Extends Editable with the defaulText option. Fills the editable area with the defaultText unless the user enters some content.

	License:
		MIT-style license.
	Authors:
		Sebastian Markbåge
*/

(function(){

var gt = Editable.prototype.getText,
	gh = Editable.prototype.getHtml,
	gx = Editable.prototype.getXhtml,
	l = Editable.prototype.onLoad,
	f = Editable.prototype.onFocus,
	b = Editable.prototype.onBlur,
	isempty = /^(&nbsp;|\s)*(?:\<p[^\>]*\>(&nbsp;|\s)*\<\/p[^\>]*\>(&nbsp;|\s)*)*$/;

Editable.implement({
	
	/*options: {
		defaultText: false,
	},*/
	
	onLoad: function(){
		l.apply(this, arguments);
		var dt = this.options.defaultText;
		if(dt && isempty.test(this.content.get('html')))
			this.setText(dt);
		return this;
	},
	
	onFocus: function(){
		var dt = this.options.defaultText;
		if(dt && this.getText() == '')
			this.setText(' ');
		return f.apply(this, arguments);
	},
	
	onBlur: function(){
		var dt = this.options.defaultText;
		if(dt && isempty.test(this.content.get('html')))
			this.setText(dt);
		return b.apply(this, arguments);
	},
	
	getHtml: function(){
		return this.getText() == '' ? '' : gh.apply(this, arguments);
	},
	
	getXhtml: function(){
		return this.getText() == '' ? '' : gx.apply(this, arguments);
	},
	
	getText: function(){
		var t = gt.apply(this, arguments), dt = this.options.defaultText;
		return (dt && t == dt) ? '' : t;
	}
	
});

})();
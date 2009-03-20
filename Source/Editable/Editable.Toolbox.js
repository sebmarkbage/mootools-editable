/*
Script: Editable.Toolbox.js
	Attaches links/buttons from an element as actions to one or more editables. Creating a toolbox.

	License:
		MIT-style license.

	Authors:
		Sebastian Markbåge
*/

Editable.Toolbox = new Class({
	
	Implements: Options,
	
	options: {
		modifierKey: Browser.Platform.mac ? 'meta' : 'control',
		hideOnBlur: false,
		hideOnStop: false
		/*
		onHide,
		onShow,
		onFocus,
		onBlur
		*/
	},
	
	initialize: function(element, editables, options){
		if ($type(editables) != 'array') editables = [editables];

		element = $(element);

		this.setOptions(options);
		options = this.options;
		
		var self = this, hideTimer, display = element.getStyle('display');
		if (display == 'none') display = 'block';
		
		if (options.hideOnBlur) element.setStyle('display', 'none');

		/*if (options.hideOnBlur || options.hideOnStop)
			element.addEvent('focus', function(){ $clear(element.hideDelay); });*/

		this.bound = {
			keyListener: function(e){
				var a;
				if (e[self.options.modifierKey] && (a = self.accessKeys[e.key])){
					if (e.type == 'keydown') a.apply(self, [e]);
					e.preventDefault();
				}
			},
			show: function() { if(this.started) { $clear(hideTimer); element.setStyle('display', display); } },
			hide: function() { $clear(hideTimer); hideTimer = element.setStyle.delay(100, element, ['display', 'none']); },
			select: function() { self.lastSelected = this; },
			deselect: function() { self.lastSelected = null; }
		};

		editables.each(this.attachEditable.bind(this));

		var keys;
		this.accessKeys = keys = {};

		element.getElements('a, button, input').each(function(el){
			var t = el.get('tag'), method, action;
			if (t == 'input' && el.get('type') != 'button') return;
			
			if (t == 'a'){
				var r = el.get('rel'), i = r.indexOf(':');
				if (i <= 0) return;
				method = r.substr(0, i);
				action = r.substr(i + 1);
			} else {
				method = el.get('name');
				action = el.attributes.getNamedItem('value').value;
			}

			var k = el.get('accesskey');
			if (k) keys[k] = function(e) { el.fireEvent('click', e); }
			
			if (method == 'show'){
				var timeout;
				el.addEvents({
					click: function(){ this.focus(); },
					focus: function(e){
						$clear(hideTimer);
						$clear(timeout);
						element.getElements(action).each(function(el){
							el.setStyle('display', 'block');
						});
						e.stop();
					},
					blur: function(){
						$clear(timeout);
						timeout = (function(){
							element.getElements(action).each(function(el){
								el.setStyle('display', 'none');
							});
						}).delay(100);
					}
				});
			} else if ($type(self[method]) == 'function') {
				el.addEvent('click', function(e){
					// Debug
					//var index;
					//editables.each(function(ed, i) { if(ed == self.lastSelected) index = i; });
					//console.log('Editable: ' + index, method, action);
					// End debug
					self[method].apply(self, action.split(','));
					e.preventDefault();
				});
				if(options.hideOnBlur)
					el.addEvents({
						focus: function(){ $clear(hideTimer); },
						blur: self.bound.hide
					});
			}
		});
	},
	
	attachEditable: function(ed){
		ed.addEvents({
			'focus': this.bound.select,
			'keydown': this.bound.keyListener,
			'keypress': this.bound.keyListener
		});
		if (this.options.hideOnBlur)
			ed.addEvents({
				'focus': this.bound.show,
				'blur': this.bound.hide
			});
		else if (this.options.hideOnStop)
			ed.addEvents({
				'start': this.bound.show,
				'stop': this.bound.hide
			});
	},
	
	detachEditable: function(ed){
		if (this.lastSelected == ed) this.lastSelected = null;
		ed.removeEvents({
			'focus': this.bound.select,
			'keydown': this.bound.keyListener,
			'keypress': this.bound.keyListener,
			'focus': this.bound.show,
			'blur': this.bound.hide,
			'start': this.bound.show,
			'stop': this.bound.hide
		});
	},

	exec: function(){
		var ls = this.lastSelected;
		if (ls)
			if (ls.exec)
				ls.exec.apply(ls, arguments);
			else if ($type(ls[arguments[0]]) == 'function')
				ls[arguments[0]].apply(ls, arguments.length > 1 ? ($type(arguments[1]) == 'array' ? arguments[1] : [arguments[1]]) : []);
	}
	
});
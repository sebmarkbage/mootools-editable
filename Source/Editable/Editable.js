/*
Script: Editable.js
	Class to make an Element editable with consistent cross-browser inline WYSIWYG functionality.

	License:
		MIT-style license.

	Authors:
		Sebastian Markbåge
*/

var Editable = new Class({

    Implements: [Events],
    
    Binds: ['onLoad', 'onFocus', 'onBlur', 'onKeyDown', 'onKeyPress', 'onKeyUp', 'onMouseDown', 'onMouseUp', 'onSelect',
			'onCut', 'onCopy', 'onPaste', 'onDragStart', 'onDragEnd', 'onDragEnter', 'onDragOver', 'onDrop'],

    options: {
        autoStart: true, /*'click'*/
        undoLevels: 50,
        blocks: true,
        formatting: true,
        multiline: true
        /*
        text: false,
        xhtml: false,
        html: false,
        
        onUndo: $empty,
        onRedo: $empty,
        onFocus: $empty,
        onBlur: $empty,
        onSelect: $empty,
        onResizeElement: $empty,
        onChange: $empty,
        onKeyDown: $empty,
        onKeyPress: $empty,
        onKeyUp: $empty,
        
        onDrag: $empty,
        onCopy: $empty,
        onCut: $empty,
        
        onDrop: $empty,
        onPaste: $empty
        */
    },
    
	initialize: function(element, options){
	    if (!Editable.isSupported(this.element = $(element))) return;

		for (var option in options){
			var o = options[option];
			if ($type(o) != 'function' || !(/^on[A-Z]/).test(option))
				this.options[option] = o;
			else
				this.addEvent(option.substr(2).toLowerCase(), o);
		}

		// Disable blocks for block/inline tags as well as when formatting is disabled
		if (!this.options.multiline || !this.options.formatting || !(/^(iframe|body|caption|table|tbody|thead|td|th|form|div|fieldset)$/i).test(this.element.tagName))
			this.options.blocks = false;

		this.onResizeElement = this.onResizeElement.bind(this);
					
		if (this.isIframe = this.element.get('tag') == 'iframe')
			new IFrame(element, { onload: this.onLoad });
		else
			this.onLoad();
	},
	
	onLoad: function(){
		this.win = this.isIframe ? this.element.contentWindow : this.element.getWindow();
		this.content = this.isIframe ? $(this.win.document.body) : this.element;

		if (this.options.xhtml || this.options.html) this.setHTML(this.options.xhtml || this.options.html);
		else if (this.options.text) this.setText(this.options.text);
		this.undirty = c.innerHTML.replace('\s', '');
        
		if (this.options.autoStart == 'click'){
			var sp = false, timer;
			c.addEvent('mousedown', function(){
				if (!sp) self.attach();
				sp = false;
			});
			c.getElements('a').each(function(el){
				el.addEvent('mousedown', function(){ sp = true; });
			});
			this.addEvents({
				focus: function(){
					$clear(timer);
				},
				blur: function(){
					timer = self.detach.delay(100, self);
				}
			});
		} else if (this.options.autoStart) this.attach();
	},
	
	toElement: function(){ return this.element; }
});

(function(){

	// Private methods

	function toggleEditable(self, start){
		if (!self.isIframe && self.element.get('tag') != 'body')
			self.element.set('contentEditable', start);
		else if (Browser.Engine.gecko && Browser.Engine.version < 19)
			self.win.document.designMode = start ? 'On' : 'Off';
		else
			self.content.set('contentEditable', start);
			
		var content = self.content;

		if (content.addEventListener) // TODO: Use addEvent instead
			['Cut', 'Copy', 'Paste', 'DragStart', 'DragEnd', 'DragEnter', 'DragOver', 'DragDrop', 'Drop'].each(function(key){
				(start ? content.addEventListener : content.removeEventListener).apply(content, [key.toLowerCase(), self['on' + key], false]);
			});
		
		// Proper way to determine where to apply events?
		if ((self.isIframe || self.element.get('tag') == 'body') && !Browser.Engine.trident) content = Browser.Engine.webkit ? self.win : self.win.document;

		['Focus', 'Blur', 'KeyDown', 'KeyPress', 'KeyUp', 'MouseDown', 'MouseUp', 'Select'].each(function(key){
			(start ? content.addEvent : content.removeEvent).apply(content, [key.toLowerCase(), self['on' + key]]);
		});
	};

	function getVer(t){
		return { html: t.content.innerHTML, sel: t.getSelection().getDomBookmark(t.content) };
	};

	function moveToVer(t, m){
		t.content.innerHTML = m.html;
		t.setSelection(t.win.document.newRange().moveToDomBookmark(m.sel, t.content));
	};
	
	function isNavigationKey(event){
		return [8,9,13,46,16,17,18,19,20,27,33,34,35,36,37,38,39,40,45,91,92,93,112,113,114,115,116,117,118,119,120,121,122,123,144].contains(event.code);
	};
			
	function fireCancelableEvent(self, type, event){
		var preventDefault = event.preventDefault, retval = true;
		event.preventDefault = function(){ retval = false; preventDefault.apply(this, arguments); }
		self.fireEvent(type, event);
		return retval;
	};
	
	// Public methods

	Editable.implement({
		
		attach: function(){
			if (this.isIframe && !this.win){ if (!this.options.autoStart) this.options.autoStart = true; return; }
			toggleEditable(this, true);
			return this;
		},
		
		detach: function(){
			toggleEditable(this, false);
			return this;
		},
		
		setHTML: function(value){
			this.content.set('html', value);
			return this;
		},
		
		setText: function(value){
			this.content.set('text', value);
			this.content.set('html', this.content.get('html').replace(/\r?\n/g, '<br />'));
			return this;
		},
		
		getHTML: function(){
			return this.content.get('html');
		},
		
		getText: function(){
			var n = this.content.firstChild, s = '';
			while(n != null){
				if (n.nodeType == 3 || n.nodeType == 8)
					s += n.nodeValue;
				else if (n.nodeType == 1 && (/^(br|p|h\d|center|pre|dt|li|div|blockquote)$/i).test(n.nodeName) && !(/^\s*$/).test(s))
					s += '\n';
					
				if (n.firstChild)
					n = n.firstChild;
				else{
					while(!n.nextSibling && n != this.content)
						n = n.parentNode;
					if (n == this.content)
						break;
					n = n.nextSibling;
				}
			}
			return s;
		},

		selectAll: function(){
			var r = this.win.document.newRange();
			r.selectNodeContents(this.content);
			return this.setSelection(r);
		},

		getSelection: function(){
			return this.selection || (this.selection = this.content.getSelectionRange());
		},
		
		setSelection: function(range){
			this.content.setSelectionRange(range);
			this.onSelect();
			return this;
		},

		isSelected: function(){
			var s = this.getSelection();
			return s.covers.apply(s, arguments);
		},
		
		isPartiallySelected: function(){
			var s = this.getSelection();
			return s.contains.apply(s, arguments);
		},
		
		clearPlaceholder: function(){
			var s = this.getSelection().getStart(), c = s.container, o = s.offset, n;
			if (c.hasChildNodes()){
				if (o > 0)
					n = c.childNodes[o - 1];
				if ((!n || (n.nodeType != 3 && n.nodeType != 4)) && o < c.childNodes.length)
					c = c.childNodes[o];
				else
					c = n;
			}
			if (c && (c.nodeType == 3 || c.nodeType == 4) && (/^\s* [ \s]*$/).test(c.nodeValue))
				c.nodeValue = '';
			return this;
		},
		
		toggleBlock: function(tag, props, selectors){
			var f = this.isSelected.apply(this, arguments);
			if (f) this.formatBlock.apply(this, arguments);
			else this.clearBlock.apply(this, arguments);
		},

		toggleInline: function(tag, props, selectors){
			var f = this.isSelected.apply(this, arguments);
			this.clearInline.apply(this, arguments);
			if (f) this.formatInline.apply(this, arguments);
		},
			
		insertBlock: function(tag){
			if (this.options.blocks){
				if (tag || !this.stopTypingTimer) this.addUndo(); else this.onStopTyping();
				var s = this.clearContents().selection;
				this.setSelection(s.insertBlock.apply(s, arguments));
			}
			return this;
		},
		
	//	formatBlock: function(tag){
	//		if (this.options.blocks){
	//			this.addUndo();
	//			var s = this.selection;
	//			this.setSelection(s.formatBlock.apply(s, arguments));
	//		}
	//		return this;
	//	},
		
		clearBlock: function(){
			this.addUndo();
			var s = this.selection;
			return this.setSelection(s.clearBlock.apply(s, arguments));
		},
		
		insert: function(){
			var s = this.getSelection();
			this.clearPlaceholder();
			$each(arguments, function(n){
				// Filter allowed tags
				if (n.nodeType != 1 || (/^br$/i).test(n.tagName) || (this.options.formatting && (this.options.blocks || (/^a|abbr|acronym|address|b|bdo|big|small|span|strike|strong|i|sub|sup|u|tt|cite|code|q|s|samp|font|em|var|kbd|del|dfn|ins$/i).test(n.tagName))))
					s.insert(n).collapseTo(false);
				else
					$A(n.childNodes).each(arguments.callee);
			});
			return this.setSelection(s);
		},
		
		insertHTML: function(html){
			return this.insert.apply(this, $A(this.win.document.newElement('div', { html: html }).childNodes));
		},
		
		insertText: function(text){
			text = text.replace(/^[\r\n]+|\r|[\r\n]+$/g, '');
			if (text == '') return;
			var r = text.split('\n'), i, b = [], d = this.win.document;
			for(i=0; i<r.length; i++){
				if (i > 0) b.push(d.createElement('br'));
				b.push(d.createTextNode(r[i]));
			}
			return this.insert.apply(this, r);
		},
		
		insertInline: function(tag){
			if (!tag) tag = 'br';
			if (tag != 'br' && !this.options.formatting) return this;
			if (tag != 'br' || !this.stopTypingTimer) this.addUndo(); else { $clear(this.stopTypingTimer); delete this.stopTypingTimer; }
			var s = this.getSelection();
			s.clearContents();
			this.clearPlaceholder();
			return this.setSelection(s.insertInline.apply(s, arguments));
		},
		
		formatInline: function(){
			if (!this.options.formatting) return this;
			this.addUndo();
			var s = this.getSelection();
			return this.setSelection(s.formatInline.apply(s, arguments));
		},
		
		clearInline: function(){
			this.addUndo();
			var s = this.getSelection();
			return this.setSelection(s.clearInline.apply(s, arguments));
		},

		clearContents: function(forward){
			this.addUndo();
			var s = this.getSelection(), e;
			if (s.isCollapsed()){
				if ($defined(forward)){
					if (forward) s.moveEndBy(1); else s.moveStartBy(-1);
					s.limitTo(this.content);
				} else return this;
			}
			e = s.getElement();
			if (e && e != this.content && this.win.document.execCommand){ // Fixes Firefox item selection rendering bug
				s.select();
				this.win.document.execCommand('delete', false, false);
				this.onSelect();
			} else
				this.setSelection(s.clearContents(true));
			return this;
		},

		addUndo: function(){
			if (!this.options.undoLevels) return this;
			
			var v = getVer(this);
			if (!this.hasUndo() || this.undos[this.undos.length - 1].html != v.html){
				delete this.redos;
				if (this.undos && this.undos.length >= this.options.undoLevels) this.undos.shift();
				(this.undos = this.undos || []).push(v);
			}
			return this;
		},
		
		hasUndo: function(){ return this.undos && this.undos.length > 0; },
		
		undo: function(){
			if (this.hasUndo()){
				this.onStopTyping(); // Something new (not typing) has happened in between
				(this.redos = this.redos || []).push(getVer(this));
				moveToVer(this, this.undos.pop());
			}
			return this;
		},

		hasRedo: function(){ return this.redos && this.redos.length > 0; },
		
		redo: function(){
			if (this.hasRedo()){
				this.onStopTyping(); // Something new (not typing) has happened in between
				(this.undos = this.undos || []).push(getVer(this));
				moveToVer(this, this.redos.pop());
			}
			return this;
		},

		onStartTyping: function(){
			// Add a new undo level when user starts typing and again after 15 seconds of inactivity
			if (this.stopTypingTimer)
				$clear(this.stopTypingTimer);
			else
				this.addUndo();
			this.stopTypingTimer = this.onStopTyping.delay(15000, this);
			return this;
		},
		
		onStopTyping: function(){
			$clear(this.stopTypingTimer);
			delete this.stopTypingTimer;
			return this;
		},
		
		onSelect: function(){
			this.onStopTyping();
			var r = this.selection = this.content.getSelectionRange(),
				o = this.selectedElement,
				oz = this.selectedElementSize,
				n = r.getElement(),
				rz = this.onResizeElement,
				sn = r.getStart().container,
				en = r.getEnd().container;
				
			if (n != o){
				if (o){
					if (o.removeEventListener)
						o.removeEventListener('resize', rz, false);
					else
						o.detachEvent('onresize', rz);
					if (o.offsetWidth != oz.x || o.offsetHeight != oz.y)
						rz({ x: o.offsetWidth, y: o.offsetHeight, target: o });
				}
				if (n){
					if (n.addEventListener)
						n.addEventListener('resize', rz, false);
					else
						n.attachEvent('onresize', rz);
				}
				this.selectedElement = n;
			}

			this.selectedElementSize = n ? { x: n.offsetWidth, y: n.offsetHeight } : null;
			
			if (r.isCollapsed() && sn.nodeType == 3 && sn == en && sn.nodeValue == ' '){
				r.setStart(sn, 0);
				r.setEnd(sn, 0);
				r.select();
			}
			return this.fireEvent('select', r);
		},

		onResizeElement: function(e){
			var ev = e || this.win.event, t = ev.target || ev.srcElement;
			if (this.selectedElement == t) this.selectedElementSize = { x: e.x, y: e.y };
			return this.fireEvent('resizeelement', [t, e.x, e.y]);
		},
		
		onFocus: function(){
			this.undirty = this.content.innerHTML.replace('\s', '');
			if (fireCancelableEvent(this, 'focus', arguments)) this.onSelect();
			return this;
		},
		
		onBlur: function(){
			this.onStopTyping();
			if (this.undirty != this.content.innerHTML.replace('\s', '')) this.onChange();
			return this.fireEvent('blur', arguments);
		},
		
		onChange: function(){
			return this.fireEvent('change', arguments);
		},
		
		onDragStart: function(event){
			var data = event.dataTransfer;
			if (data){
				// Override copy with custom logic, cut with custom delete logic (primarily for WebKit)
				var s = this.getSelection();
				data.clearData();
				data.setData('text/plain', s.getText());
				data.setData('text/html', s.getHTML());
				data.effectAllowed = 'copyMove';
				event.preventDefault();
			} 
		},

		onDragEnd: function(event){
			var data = event.dataTransfer;
			if (data && data.dropEffect == 'move'){
				this.clearContents();
				event.preventDefault();
			}
		},
		
		onDragEnter: function(event){
			// event.preventDefault();
		},
		
		onDragOver: function(event){
			// event.preventDefault();
		},
		
		onDrop: function(event){
			// event.preventDefault();
		},
		
		onCopy: function(event){
			var data = event.clipboardData;
			if (data && Browser.Engine.webkit){
				var s = this.getSelection();
				data.clearData();
				data.setData('text/plain', s.getText());
				data.setData('text/html', s.getHTML());
				event.preventDefault();
			}
		},
		
		onCut: function(event){
			var data = event.clipboardData;
			if (data && Browser.Engine.webkit){
				var s = this.getSelection();
				data.clearData();
				data.setData('text/plain', s.getText());
				data.setData('text/html', s.getHTML());
			} else this.win.document.execCommand('copy');
			this.clearContents();
			event.preventDefault();
		},
		
		onPaste: function(event){
			var data = event.clipboardData;
			if (data && Browser.Engine.webkit){
				var s = this.getSelection(), content;
				if (content = d.getData('text/html'))
					this.insertHTML(content);
				else if (content = d.getData('text/plain'))
					this.insertText(content);
				if (content) e.preventDefault();
			}
		},
		
		onMouseDown: function(event){
			if (Browser.Engine.trident){
				var n = event.target, self = this;
				while(n && n != this.content && n.parentNode){
					if (n.currentStyle.hasLayout && !(/^(iframe|img|input|applet|object|embed|button|select|textarea|hr|br|style|link|script)$/i).test(n.tagName)){ new Range(n, 0, n, n.length).select(); self.onFocus(); break; } // Pass through IE's annoying boxing of hasLayout elements, trigger onFocus event
					n = n.parentNode;
				}
			}
		},
		
		onMouseUp: function(event){
			if (this.selectedElement){
				var o = this.selectedElement, oz = this.selectedElementSize, self = this;
				(function(){
					var x = o.offsetWidth, y = o.offsetHeight;
					if (x != oz.x || y != oz.y) self.onResizeElement({ x: x, y: y, target: o });
				}).delay(50);
			}
			this.onSelect();
		},
		
		onKeyDown: function(event){
			var key = event.key,
				code = event.code,
				noModifier = !event.meta && !event.control && !event.alt,
				ctrl = event.control || event.meta;  // Only reliable way to override shortcuts is to allow either control OR meta?
			
			if (event.key.length == 1 && noModifier && this.options.undoLevels) this.onStartTyping();

			if (!fireCancelableEvent(this, 'keydown', event)) return;
				
			if (!isNavigationKey(event) && noModifier){
				// If input key and not collapsed -> clear (fixes IE bug of not clearing image element and prevents Safari's stylish formatting)
				var s = this.content.getSelectionRange();
				if (!s.isCollapsed()){ this.addUndo(); this.setSelection(s.clearContents()); }
				this.clearPlaceholder();
			} 
			
			if (key == 'space' && event.shift && ctrl && !event.alt){ this.insert(this.win.document.createTextNode(' ')); event.preventDefault(); }
			if (key == 'a' && ctrl && !event.alt && !event.shift){ this.selectAll(); event.preventDefault(); }
			if (key == 'backspace' || key == 'delete') { this.clearContents(key == 'delete'); event.preventDefault(); }
			if (key == 'enter' && this.options.multiline && !event.alt && !event.control && !event.meta){
				if (this.options.blocks && !event.shift) this.insertBlock(); else this.insertInline('br');
				event.preventDefault();
			}
			// if (event.key == 'v' && ctrl) onpaste
			if (key == 'z' && ctrl && this.options.undoLevels){
				if (event.shift) this.redo(); else this.undo();
				event.preventDefault();
			}
			if (key == 'y' && ctrl && this.options.undoLevels && !event.shift){ this.redo(); event.preventDefault(); }
			// TODO: Override tab and indent outdent
		},

		onKeyPress: function(event){
			var code = event.code;
			if (fireCancelableEvent(this, 'keypress', event) && event.event.which == 0 && (code == 13 || code == 8 || code == 46) && !event.alt && !event.meta)
				event.preventDefault();
		},

		onKeyUp: function(event){
			if (fireCancelableEvent(this, 'keyup', event)){
				if(isNavigationKey(event))
					this.onSelect();
				else
					this.selection = this.content.getSelectionRange();
			}
		},
		
		executeCommand: function(command, value){
			var cmd = this[command];
			if ($type(cmd) == 'function') return cmd.run(value, this);
			cmd = Editable.Commands[command];
			if (cmd.exec) return cmd.exec.run(value, this);
			if (!this.isCommandAvailable(command, value)) return false;
			this.addUndo();
			this.content.focus();
			this.getSelection().select();
			try { return this.win.document.execCommand(command.toLowerCase(), false, value); }
			catch(e) { return false; }
		},
		
		getCommandState: function(command, value){
			var cmd = Editable.Commands[command];
			if (cmd && cmd.state) return cmd.state.run(value, this);
			try { return this.win.document.queryCommandState(command.toLowerCase(), false, value); }
			catch(e) { return false; }
		},
		
		isCommandAvailable: function(command, value){
			if ($type(this[command]) == 'function') return true;
			var cmd = Editable.Commands[command];
			if (cmd) return cmd.available ? cmd.available.run(value, this) : !!cmd.exec;
			try { return this.win.document.queryCommandEnabled(command.toLowerCase(), false, value); }
			catch(e) { return false; }
		}

	});

})();

Editable.isSupported = function(element){
	var requiresContentEditable = element && !(/^(iframe|body)$/i).test($type(element) == 'string' ? element : element.tagName);
	return Browser.Engine.gecko ? (Browser.Engine.version >= (requiresContentEditable ? 19 : 18)) : ['presto', 'trident', 'webkit'].contains(Browser.Engine.name);
};

Editable.Commands = {

	formatBlock: { state: function(){ return this.isSelected.apply(this, arguments); } },
	
	undo: { available: function(){ return this.hasUndo(); } },
	redo: { available: function(){ return this.hasRedo(); } }

};

Element.Properties.editable = {

	set: function(options){
		var editable = this.retrieve('editable');
		if (editable) editable.detach();
		this.eliminate('editable').store('editable:options', $extend({autoStart: false}, options));
		return this;
	},

	get: function(options){
		if (options || !this.retrieve('editable')){
			if (options || !this.retrieve('editable:options')) this.set('editable', options);
			this.store('editable', new Editable(this, this.retrieve('editable:options')));
		}
		return this.retrieve('editable');
	}

};

Element.implement({

	edit: function(options){
		var e = this.get('editable', options);
		if (!options || options.autoStart == undefined) e.attach();
		return this;
	},
	
	stopEditing: function(){
		var e = this.get('editable');
		if (e) e.detach();
		return this;
	}

});

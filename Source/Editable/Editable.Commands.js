/*
Script: Editable.Exec.js
	Extends Editable with a syntax similiar to the non-standard execCommand used by many browsers
	and HTML 5. Provides consistent cross-browser behavior for common commands.

	License:
		MIT-style license.

	Authors:
		Sebastian Markbåge
*/

/*
TODO:
indent
outdent

decreasefontsize
increasefontsize
*/
$extend(Editable.Commands, {

	selectAll: {
		exec: function(){ this.content.select(); return this; }
	},
	
	unselect: {
		exec: function(){ new Range(this.content, 0, this.content, 0).select(); return this; }
	},

	'delete': {
		exec: function(){ return this.clearContents(false); }
	},
	
	deleteForward: {
		exec: function(){ return this.clearContents(true); }
	},
	
	insertImage: {
		exec: function(src, alt){ return this.insertInline('img', { src: src, alt: alt || "" }); },
		state: function(src){ var el = this.getSelection().getElement(); return el && el.tagName.toLowerCase() == 'img' && (src == undefined || el.src == src); }
	},
	
	insertHorizontalRule: {
		exec: function(){ return this.insertBlock('hr'); },
		state: function(){ return this.isSelected('hr'); }
	},
	
	insertLineBreak: {
		exec: function() { return this.insertHTML('<br />'); }
	},
	
	bold: {
		exec: function(){ return this.toggleInline('b', 'strong', '*[style*=font-weight: bold]'); },
		state: function(){ return this.isSelected('b', 'strong', '*[style*=font-weight: bold]'); }
	},
	
	italic: {
		exec: function(){ return this.toggleInline('i', 'em', '*[style*=font-style: italic]'); },
		state: function(){ return this.isSelected('i', 'em', '*[style*=font-style: italic]'); }
	},
	
	underline: {
		exec: function(){ return this.toggleInline('u', '*[style*=text-decoration: underline]'); },
		state: function(){ return this.isSelected('u', '*[style*=text-decoration: underline]'); }
	},
	
	strikethrough: {
		exec: function(){ return this.toggleInline('s', 'strike', '*[style*=text-decoration: line-through]'); },
		state: function(){ return this.isSelected('s', 'strike', '*[style*=text-decoration: line-through]'); }
	},
	
	strong: {
		exec: function(){ return this.toggleInline('strong', 'b', '*[style*=font-weight: bold]'); },
		state: function(){ return this.isSelected('strong', 'b', '*[style*=font-weight: bold]'); }
	},
	
	em: {
		exec: function(){ return this.toggleInline('em', 'i', '*[style*=font-style: italic]'); },
		state: function(){ return this.isSelected('em', 'i', '*[style*=font-style: italic]'); }
	},
	
	strike: {
		exec: function(){ return this.toggleInline('strike', 's', '*[style*=text-decoration: strike-through]'); },
		state: function(){ return this.isSelected('strike', 's', '*[style*=text-decoration: strike-through]'); }
	},
	
	subscript: {
		exec: function(){
			var f = this.isSelected('sub');
			this.clearInline('sub');
			if (f) this.clearInline('sup').formatInline('sub');
		},
		state: function(){ return this.isSelected('sub'); }
	},
	
	superscript: {
		exec: function(){
			var f = this.isSelected('sup');
			this.clearInline('sup');
			if (f) this.clearInline('sub').formatInline('sup');
		},
		state: function(){ return this.isSelected('sup'); }
	},
	
	createLink: {
		exec: function(href){ return this.clearInline('a[href]').formatInline('a', { 'href': href }); },
		state: function(href){ return this.isSelected('a', { 'href': href }); } // TODO: function(n){ return n.nodeName == 'a' && (href == undefined || n.href == href); }
	},
	
	unlink: {
		exec: function(){ return this.clearInline('a[href]'); },
		available: function(){ return this.isSelected('a[href]'); }
	},
	
	removeFormat: {
		exec: function(){ return this.clearInline(); }
	},
	
	foreColor: {
		exec: function(color){ return this.formatInline({ 'styles': { 'color': color } }); },
		state: function(color){ return this.isSelected({ 'styles': { 'color': color } }); }
	},
	
	backColor: {
		exec: function(color){ return this.formatInline({ 'styles': { 'background-color': color } }); },
		state: function(color){ return this.isSelected({ 'styles': { 'backgroundColor': color } }); }
	},
	
	hiliteColor: {
		exec: function(color){ return this.formatInline({ 'styles': { 'background-color': color } }); },
		state: function(color){ return this.isSelected({ 'styles': { 'backgroundColor': color } }); }
	},
	
	fontName: {
		exec: function(name){ return this.formatInline({ 'styles': { 'font-name': name } }); },
		state: function(name){ return this.isSelected({ 'styles': { 'fontName': name } }); }
	},
	
	fontSize: {
		exec: function(size){ return this.formatInline({ 'styles': { 'font-size': size } }); },
		state: function(size){ return this.isSelected({ 'styles': { 'fontSize': size } }); }
	},
	
	insertParagraph: {
		exec: function(){ return this.insertBlock('p'); },
		state: function(){ return this.isSelected('p'); }
	},
	
	insertOrderedList: {
		exec: function(){ return this.toggleBlock('ol'); },
		state: function(){ return this.isSelected('ol'); }
	},
	
	insertUnorderedList: {
		exec: function(){ return this.toggleBlock('ul'); },
		state: function(){ return this.isSelected('ul'); }
	},
	
	heading: {
		exec: function(){ return this.formatBlock.apply(this, arguments); },
		state: function(){ return this.isSelected.apply(this, arguments); }
	},
	
	justifyCenter: {
		exec: function(){ return this.toggleBlock({ styles: { 'text-align': 'center' } }); },
		state: function(){ return this.isSelected({ styles: { 'text-align': 'center' } }); }
	},
	
	justifyFull: {
		exec: function(){ return this.toggleBlock({ styles: { 'text-align': 'justify' } }); },
		state: function(){ return this.isSelected({ styles: { 'textAlign': 'justify' } }); }
	},
	
	justifyLeft: {
		exec: function(){
			var el = this.getSelection().getElement();
			if (el && (/^(img|div)$/i).test(el.tagName))
				$(el).setStyle('float', $(el).getStyle('float') == 'left' ? null : 'left');
			else
				this.toggleBlock({ styles: { 'textAlign': 'left' } });
			return this;
		},
		state: function(){
			var el = this.getSelection().getElement();
			if (el && (/^(img|div)$/i).test(el.tagName))
				return $(el).getStyle('float') == 'left';
			else
				return this.isSelected({ styles: { 'textAlign': 'left' } });
		}
	},
	
	justifyRight: {
		exec: function(){
			var el = this.getSelection().getElement();
			if (el && (/^(img|div)$/i).test(el.tagName))
				$(el).setStyle('float', $(el).getStyle('float') == 'right' ? null : 'right');
			else
				this.toggleBlock({ styles: { 'textAlign': 'right' } });
			return this;
		},
		state: function(){
			var el = this.getSelection().getElement();
			if (el && (/^(img|div)$/i).test(el.tagName))
				return $(el).getStyle('float') == 'right';
			else
				return this.isSelected({ styles: { 'textAlign': 'right' } });
		}	
	}
		
});
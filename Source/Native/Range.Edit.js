/*
Script: Range.Edit.js
	Extends Range with helper functions to modify the HTML 4/XHTML 1 DOM.

License:
	MIT-style license.
*/

(function(){ // Wraps helper functions in context

	function isWhitespace(n, so, eo){ return n && isText(n) && (/^[ \r\n\t]*$/).test(n.nodeValue.substring(so || 0, $defined(eo) && eo > -1 ? eo : n.nodeValue.length)); }
	function isText(n){ return n && (n.nodeType == 3 || n.nodeType == 4); }
	function isDiv(n){ return n && (/^(body|blockquote|caption|table|td|th|form|div|table|ul|ol|dl|dd|dt|li|fieldset)$/i).test(n.tagName); }
	function isBlock(n){ return n && (/^(center|h1|h2|h3|h4|h5|h6|p|pre|legend|label)$/i).test(n.tagName); }
	function isInline(n){ return n && (/^(a|abbr|acronym|address|b|bdo|big|small|span|strike|strong|i|sub|sup|u|tt|cite|code|q|s|samp|font|em|var|kbd|del|dfn|ins)$/i).test(n.tagName); }
	function isItem(n){ return n && (/^(iframe|img|input|applet|object|embed|button|select|textarea|hr|br|style|link|script)$/i).test(n.tagName); }
	// Special attention: blockquote dt dd li label
	
	var placeHolder = Browser.Engine.trident ? '' : ' ';

	function getNodeIterator(sn, so, en, eo, reverse, topDown){
			
			/*if (arguments.length < 4){ // Enable range as first param
				if (arguments.length > 1) reverse = arguments[1];
				if (arguments.length > 2) topDown = arguments[2];
				var st = sn.getStart(), end = sn.getEnd();
				sn = st.container;
				so = st.offset;
				en = end.container;
				eo = end.offset;
			}*/
			
			if(sn == en && so == eo) return { fetch: $lambda(false) };

			function getN(n, o, v, t, on){
				if (!n.hasChildNodes()) return n;
				var si = v ? 'previousSibling' : 'nextSibling',
					ch = v ? 'lastChild' : 'firstChild';
				if (v) o--;
				if (o >= 0 && o < n.childNodes.length){
					n = n.childNodes[o];
					if (t)
						while(n[ch] /*&& !isItem(n)*/)
							n = n[ch];
				} else if (!t){
					do {
						if (n[si]) { n = n[si]; break; }
						n = n.parentNode;
					} while(n != on);
				}
				return n;
			}

			if (reverse){ var t = sn; sn = en; en = t; t = so; so = eo; eo = t; }
			
			sn = getN(sn, so, reverse, topDown, en);
			en = getN(en, eo, !reverse, !topDown, sn);
			
			return {
				reset: function(){ this.current = false; },
				fetch: function(){
					if (!this.current) return this.current = sn;
					if (this.current == en) return false;
					var c = this.current,
						si = reverse ? 'previousSibling' : 'nextSibling',
						ch = reverse ? 'lastChild' : 'firstChild';
					if (topDown){
						if (!c[si]) return this.current = c.parentNode;
						c = c[si];
						while(c[ch] /*&& !isItem(c)*/)
							c = c[ch];
						return this.current = c;
					}
					if (c[ch]) return this.current = c[ch];
					while(!c[si]){
						c = c.parentNode;
						if (c == en) return this.current = c;
					}
					return this.current = c[si];
				}
			};
		}

	function getBlockIterator(r){
		
	}
	
	// Returns true if no meaningful characters or elements are in the range
	function isEmptyish(sn, so, en, eo){
		if (sn == en && so == eo) return true;
		var it = getNodeIterator.apply(this, arguments), n;
		while(n = it.fetch()){
			if ((isText(n) && !isWhitespace(n, n == sn ? so : 0, n == en ? eo : -1)) ||
				(n.nodeType == 1 && !(/^br$/i).test(n.tagName) && !isBlock(n) && !isInline(n)))
				return false;
		}
		return true;
	}
	
	function moveEndPointBy(r, start, offset){
		//if (start && r.moveStart) r.moveStart('character', offset);
		//else if (!start && r.moveEnd) r.moveEnd('character', offset);

		var f = offset > 0,
			p = start ? r.getStart() : r.getEnd(),
			d = p.container.ownerDocument,
			b = d.body,
			it = getNodeIterator(f ? p.container : b, f ? p.offset : 0, f ? b : p.container, f ? b.childNodes.length : p.offset, !f, false),
			n, o = isText(p.container) ? p.offset : -1,
			i = Math.abs(offset),
			li;
		
		while(n = it.fetch()){
			if (isText(n)){
				if (li || !isWhitespace(n)){
					if (o == -1) o = f ? 0 : n.nodeValue.length;
					o += f ? i : -i;
					if (o >= 0 && o <= n.nodeValue.length) break;
					i = o < 0 ? -o : o - n.nodeValue.length;
					li = false;
				}
			} else if (!isInline(n)){
				if (isItem(n)){
					if (i > 1) i--;
					else {
						if (i <= 0) f = !f;
						var t = n;
						n = n.parentNode;
						o = f ? 0 : -1;
						while(t){ o++; t = t.previousSibling; }
						break;
					}
				} else if (i > 0) i--;
				li = false;
			} else
				li = true;
			o = -1;
		}
		if (n){
			if (start)
				r.setStart(n, o);
			else
				r.setEnd(n, o);
		}
		return r;
	}

	Range.implement({

		moveStartBy: function(characterOffset) { return moveEndPointBy(this, true, characterOffset); },
		moveEndBy: function(characterOffset) { return moveEndPointBy(this, false, characterOffset); },

		contains: function(){
			// selectors = arguments
			
			// TODO: returns true if any of the selected elements matches one of the selectors
			
			return false;
		},
		
		covers: function(){
			// selectors = arguments
			
			// TODO: returns true if all selected elements matches one of the selectors

			return false;
		},
		
		insertBlock: function(tag, props){
			if ($type(tag) == 'string') tag = tag.toLowerCase();
			
			this.clearContents(true);
			var st = this.getStart(), n = st.container, o = st.offset,
				b = n, p = n.nodeType == 1 && o < n.childNodes.length ? n.childNodes[o] : false;

			while(!isBlock(b)){
				if (isDiv(b)){
					var bl = b.tagName.toLowerCase();
					bl = bl == 'dt' ? 'dd' : (bl == 'dd' ? 'dt' : bl);
					if (!tag && !props && bl == 'label')
						return this.insertInline('br');
					else if (bl == 'li' || bl == 'dt' || bl == 'dd') {
						if (tag == bl) break;
						else if (isEmptyish(b, 0, b, b.childNodes.length)){
								// Break out of parent
								var t = b.parentNode.firstChild;
								do {
									if (t.nodeType == 1 && b != t) break;
								} while(t = t.nextSibling);
								if (!t) {
									// Delete parent
									p = b.ownerDocument.createElement('p');
									p.innerHTML = placeHolder;
									b.parentNode.parentNode.insertBefore(p, b.parentNode);
									b.parentNode.parentNode.removeChild(b.parentNode);
									s.selectContents(p);
									s.collapse(true);
									this.setSelection(s);
									return this;
								}
								t = b;
								o = 0;
								while(t = t.previousSibling) o++;
								n = b.parentNode;
								b.parentNode.removeChild(b);
								b = n;
								if (!tag) {tag = 'p'; props = { html: placeHolder }; }
								continue;
						}
						else if (!tag) break;
						// Else continue and split in ul, ol or dl instead
					} else if (bl == 'ul' || bl == 'ol' || bl == 'dl' || tag == bl)
						break;
					else {
						// No block, wrap content in p-tag
						var t = n.ownerDocument.createElement('p');
						while(p && !isBlock(p) && !isDiv(p))
							p = p.previousSibling;
						b.insertBefore(t, p ? p.nextSibling : b.firstChild);
						b = t;
						t = t.nextSibling;
						while(t && !isBlock(t) && !isDiv(t)){
							var tt = t.nextSibling;
							b.appendChild(t);
							t = tt;
						}
						break;
					}
				}
				p = b;
				b = b.parentNode;
			}
			var f = isEmptyish(b, 0, n, o);
			var l = !f && isEmptyish(n, o, b, b.childNodes.length);
		
			if (!l && !f){ // Split block
				if (!tag && b.tagName.toLowerCase() == 'dt') p = b.ownerDocument.createElement('dd');
				else if (!tag && b.tagName.toLowerCase() == 'dd') p = b.ownerDocument.createElement('dt');
				else p = b.cloneNode(false);
				new Range(n, o, b, b.childNodes.length).extractContentsTo(p);
				b.parentNode.insertBefore(p, b.nextSibling);
			} else if (!tag){ // Insert blank
				if (b.tagName.toLowerCase() == 'dt') p = b.ownerDocument.createElement('dd');
				else if (b.tagName.toLowerCase() == 'dd') p = b.ownerDocument.createElement('dt');
				else if (!f && (/^(h\d|[uod]l)$/i).test(b.tagName) && (!b.nextSibling || b.nextSibling.tagName != b.tagName)) p = b.ownerDocument.createElement('p');
				else p = b.cloneNode(false);
				b.parentNode.insertBefore(p, b.nextSibling);
				if (f) {
					while(b.firstChild) p.appendChild(b.firstChild);
					b.innerHTML = placeHolder;
				} else p.innerHTML = placeHolder;
			}
			if (tag){ // Insert new tag
				p = $type(tag) == 'element' ? $(tag) : b.ownerDocument.newElement(tag, props);
				p.inject(b, f ? 'before' : 'after');
				if (isItem(p))
					p = p.nextSibling || p;
				else if (!p.firstChild && (isBlock(p) || isDiv(p)))
					s.innerHTML = placeHolder;
			}
			this.selectContents(p);
			this.collapseTo(true);
			return this;
		},
		
		formatBlock: function(tag, props){
			if ($type(tag) == 'object') { props = tag; tag = false; }
			
			// TODO
			
			return this;
		},
		
		clearBlock: function(tag, props){
			if ($type(tag) == 'object') { props = tag; tag = false; }
		
			// TODO
			
			return this;
		},
		
		insertInline: function(tag, props){
			var n = this.getAncestor().ownerDocument.newElement(tag, props), t;
			this.insert(n);
			if (tag == 'br') { // Insert &nbsp; after br if it's the last content in block or div
				t = n;
				var l = true;
				while(true){
					if (t.nextSibling){
						t = t.nextSibling;
						if (isBlock(t) || isDiv(t))
							break;
						else if (
							((isText(t)) && !(/^[\s ]*$/).test(t.nodeValue)) ||
							isItem(t) ||
							(t.nodeType == 1 && !(/^[\s ]*$/).test(t.innerText))
						){
							l = false;
							break;
						}
					} else {
						t = t.parentNode;
						if (isBlock(t) || isDiv(t))
							break;
					}
				}
				if (l) n.parentNode.insertBefore(n.ownerDocument.createTextNode(' '), n.nextSibling);
			}
			t = n.nextSibling;
			if (!t || t.nodeType == 1)
				n.parentNode.insertBefore(t = n.ownerDocument.createTextNode(''), n.nextSibling); // Insert a focus point
			this.setEnd(t, 0); this.setStart(t, 0);
			return this;
		},
		
		formatInline: function(tag, props){
			if ($type(tag) == 'object') { props = tag; tag = false; }
			
			var st = this.getStart(), sn = st.container, so = st.offset,
				end = this.getEnd(), en = end.container, eo = end.offset;
			
			// TODO
			
			return this;
		},
		
		clearInline: function(tag, props){
			if ($type(tag) == 'object') { props = tag; tag = false; }
			
			// TODO

			return this;
		},
		
		insert: function(node, atStart){
			if (atStart != undefined)
				this.collapse(atStart);
			else
				this.clearContents();
				
			if (isDiv(node) || isBlock(node)) return this.insertBlock(node);
			
			var st = this.getStart();
			var c = st.container, o = st.offset;
			switch(c.nodeType){
				case 1:
					var r = c.childNodes[o], pr;
					if (isText(node)){
						if(isText(r)){
							r.nodeValue = node.nodeValue + r.nodeValue;
							this.setEnd(r, node.nodeValue.length);
							this.setStart(r, 0);
							return this;
						} else if (o > 0 && isText(node) && isText(pr = c.childNodes[o - 1])){
							o = pr.nodeValue.length;
							pr.nodeValue += node.nodeValue;
							this.setStart(pr, o);
							this.setEnd(pr, pr.nodeValue.length);
							return this;
						}
					}
					c.insertBefore(node, r);
				break;
				case 3: case 4:
					if (isText(node)){
						c.nodeValue = c.nodeValue.substr(0, o) + node.nodeValue + c.nodeValue.substr(o);
						this.setEnd(c, o + node.nodeValue.length);
						this.setStart(c, o);
						return this;
					} else if (o == 0)
						c.parentNode.insertBefore(node, c);
					else {
						var tn = c.ownerDocument.createTextNode(c.nodeValue.substr(o));
						c.nodeValue = c.nodeValue.substr(0, o);
						c.parentNode.insertBefore(node, c.nextSibling);
						c.parentNode.insertBefore(tn, node.nextSibling);
					}
				break;
			}
			this.selectNode(node);
			return this;
		},
		
		extractContentsTo: function(node){
			this.cloneContentsTo(node);
			this.clearContents();
		},
				
		extractContents: function(){
			var content = this.cloneContents();
			this.clearContents();
			return content;
		},
		
		clearContents: function(moveBlockRemainder){
			if (this.isCollapsed()) return this;
			
			var s = this.getStart(), sn = s.container, so = s.offset,
				e = this.getEnd(), en = e.container, eo = e.offset,
				a = this.getAncestor(),
				it = getNodeIterator(sn, so, en, eo, true, true),
				n, eb;
				
			n = it.fetch();
			while(n){
				if (!eb && (isBlock(n) || isDiv(n))) eb = n;
				var t = n;
				if (isText(n) && (n == en || n == sn)){
					var v = n.nodeValue, nv = n == sn ? v.substr(0, so) : '';
					if (n == en) nv += v.substr(eo);
					n.nodeValue = nv;
					if (nv != '' || n == sn)
						t = false;
				}
				n = it.fetch();
				if (t && t != a && !t.hasChildNodes()) t.parentNode.removeChild(t);
			}

			var sb, ia;
			sb = sn;
			if (sb.nodeType == 1 && so < sb.childNodes.length) sb = sb.childNodes[so];
			while(sb && !isBlock(sb) && !isDiv(sb)){
				ia = sb.nextSibling;
				sb = sb.parentNode;
			}
			
			if (moveBlockRemainder && sn != en && sb && sb != eb){ // Move remainder of the end block to the first block
				if (eb)
					n = eb.firstChild;
				else if (isText(en))
					n = en.parentNode ? en : false;
				while(n && !isBlock(n) && !isDiv(n)){
					var t = n;
					n = n.nextSibling;
					if (ia) sb.insertBefore(t, ia); else sb.appendChild(t);
				}
			}

			if (eb && eb != a && eb.parentNode && isEmptyish(eb, 0, eb, eb.childNodes.length)){ // Remove empty blocks
				while(eb.parentNode != a && eb.parentNode.nodeType != 11 && eb.parentNode.childNodes.length < 2)
					eb = eb.parentNode;
				eb.parentNode.removeChild(eb);
			}

//			if (isWhitespace(sn)){ //Remove empty inline tags - DISABLED - SHOULD NEVER DELETE CONTAINER
//				n = sn;
//				while(n.parentNode.childNodes.length <= 1 && n.parentNode != a && isInline(n.parentNode))
//					n = n.parentNode;
//				if (n != sn){
//					n.parentNode.insertBefore(sn, n);
//					n.parentNode.removeChild(n);
//					if (isText(sn.previousSibling)){
//						sn = sn.previousSibling;
//						so = sn.nodeValue.length;
//					}
//				}
//			}

			if ((isBlock(sb) || isDiv(sb)) && isEmptyish(sb, 0, sb, sb.childNodes.length)){ // Insert placeholder
				var t = sb.ownerDocument.createTextNode(' ');
				if (ia) sb.insertBefore(t, ia); else sb.appendChild(t);
			}

			n = sn.hasChildNodes() ? (so > 0 ? sn.childNodes[so - 1] : false) : sn;
			if (n && isText(n) && n.nextSibling && isText(n.nextSibling)){ // Merge two text nodes
				if (sn != n){
					sn = n;
					so = n.nodeValue.length;
				}
				n.nodeValue += n.nextSibling.nodeValue;
				n.parentNode.removeChild(n.nextSibling);
			}
			
			this.selectContents(a);
			this.setEnd(sn, so);
			this.setStart(sn, so);
			
			return this;
		}

	});

})();

/*
Script: Range.XML.js
	Extends Range with a method to get the selected DOM fragment as a valid XML fragment.

	License:
		MIT-style license.
	
	Authors:
		Sebastian Markbåge
*/

Range.implement({

	getXML: function(){

		var xml, di = document.implementation;
		if(di && di.createDocument)
			xml = di.createDocument('', '', null);
		else
			try{xml = new ActiveXObject('MSXML2.DOMDocument');} catch (e){
				try{xml = new ActiveXObject('Microsoft.XmlDom');} catch (e) {}
			}
		if(!xml) return null;

		if(xml.firstChild) xml.removeChild(xml.firstChild);
		
		var ras = {img: {src: '', alt: ''}, area: {alt: ''}, textarea: { rows: '2', cols: '20' }},
		p = xml.appendChild(xml.createElement("r"));
		
		var a = this.getAncestor(),
			st = this.getStart(), sn = st.container, so = st.offset,
			end = this.getEnd(), en = end.container, eo = end.offset,
			n, nn;

		var p = null, el = sn.nodeType == 1 ? (sn.childNodes[so] 
		while(el != null){
			var n;
			switch(el.nodeType) {
				case 1:
					n = xml.createElement(el.nodeName.toLowerCase());
					for(var i=0;i<el.attributes.length;i++){
						var a = el.attributes[i];
						if (a.specified && $chk(a.nodeValue) && $type(a.nodeValue) != 'function' && !(/^(\$|\_|uid)/).test(a.nodeName))
							n.setAttribute(a.nodeName.toLowerCase(), a.nodeValue);
					}
					var ra = ras[n.nodeName];
					if(ra)
						for(var k in ra)
							if(el.getAttribute(k) == null || el.getAttribute(k) == '')
								n.setAttribute(k, ra[k]);
					if(!el.firstChild && !(/img|hr|br|input|link|meta/i).test(el.nodeName))
						n.appendChild(xml.createTextNode(''));
					break;
				case 3: case 4: n = xml.createTextNode(el.nodeValue); break;
				case 8: n = xml.createComment(el.nodeValue); break;
				default: continue;
			}
			p.appendChild(n);
			if(el.firstChild){
				el = el.firstChild;
				p = n;
			} else {
				while(!el.nextSibling && el != node){
					el = el.parentNode;
					p = p.parentNode;
				}
				if(el == node) break;
				el = el.nextSibling;
			}
		}
		
		var s = xml.xml || new XMLSerializer().serializeToString(xml.documentElement);
		return s.substr(3, s.lastIndexOf('>') - 6).replace(/ /g, '&#160;'); // Hack to get document fragment. Create nbsp-entities for visibility
	}

});
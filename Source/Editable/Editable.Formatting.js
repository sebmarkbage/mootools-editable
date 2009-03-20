/*
Script: Editable.Formatting.js
	Extends Editable with Uri parsing behavior to transform Uris relative to a base path and XHTML generation.
	These are useful features for simplifying server-side parsing.

License:
	MIT-style license.
*/

(function(){

	function transformUris(e, html, rev){
		var t = e.options.uriTransformer,
			bu = new Uri(rev ? e.options.basePath : false),
			nu = new Uri(rev ? false : e.options.basePath),
			urls = /(\s(?:src|href)\s*\=\s*)(\"[^\"]*\"|\'[^\']*\'|[^\s\'\"\>]+)/gi,
			styles = /(\<style[^>]*\>)(.*?)(\<\/style\s*\>)|(\sstyle\s*\=\s*)(\"[^\"]*\"|\'[^\']*\'|[^\s\'\"\>]+)/gi,
			surls = /([\s\:]url\()(\"[^\"]*\"|\'[^\']*\'|[^\s\'\"\)]+)(?=\))/gi,
			su = function($0, $1, url){
				if ((/^[\'\"]/).test(url)) url = url.substr(1, url.length - 2);
				url = url.replace(/\&quot\;|\&\#34\;/g, '"').replace(/\&amp\;|\&\#38\;/g, '&');
				var s = (/[\s\:]url/).test($1) ? "'" : '"';
				return $1 + s + gu(url).replace(/\&(?![a-z]{2,6}\;|\#\d{2,3}\;)/g, '&#38;').replace('"', '&#34;') + s;
			},
			gu = function(url){
				var u = new Uri(bu, url);
				if (t){
					u = t.apply(e, [u, rev]);
					if ($type(u) == 'string') u = new Uri(bu, u);
				}
				return (rev || e.options.basePath == false ? u.toString() : (bu.directory == '/' ? u.toAbsolute(nu) : u.toRelative(nu)));
			};
		return html.replace(urls, su).replace(styles, function($0, $1, $2, $3, $4, $5){
			if ($4){
				if ((/^[\'\"]/).test($5)) $5 = $5.substr(1, $5.length - 2);
				return $4 + '"' + $5.replace(surls, su) + '"';
			}
			return $1 + $2.replace(surls, su) + $3;
		});
	}
	
	Editable.implement({
		
		/*options: {
			uriTransformer: $empty,
			basePath: undefined
		},*/
		
		setHTML: function(value){
			this.content.set('html', transformUris(this, value, true));
			return this;
		},
		
		getHTML: function(){
			return transformUris(this, this.content.get('html'), false);
		},
		
		getSelectionHTML: function(){
			return transformUris(this, this.getSelection().getHTML(), false);
		},
		
		setXHTML: function(value){
			return this.setHTML(value);
		},

		getXHTML: function(){
			return transformUris(this, new Range(this.content, 0, this.content, this.content.childNodes.length).getXML(), false);
		},
		
		getSelectionXHTML: function(){
			return transformUris(this, this.getSelection.getXML(), false);
		}
		
	});

})();
/*
Script: Uri.js
	Class to parse and modify Uris.

License:
	MIT-style license.
*/

var Uri = new Class({
	/*
	HTTP: protocol, user, password, hostname, port, directory, pathname, file, search, hash
	MAILTO: email, username, hostname, headers, subject, body
	*/

	initialize: function(baseUri, relativeUri){
		if(!relativeUri && relativeUri !== 0){
			if(!Uri.base){
				Uri.base = new Uri({}, window.location.href);
				var bases = document.getElementsByTagName('base');
				for(var i=bases.length-1;i>=0;i--) if(bases[i].href){ Uri.base = new Uri(bases[i].href); break; }
			}
			relativeUri = baseUri;
			baseUri = Uri.base;
			if(!relativeUri && relativeUri !== 0) return baseUri;
		}
		
		if(relativeUri.scheme) return $extend(this, relativeUri);

		relativeUri = relativeUri.toString();
		
		var match;
		if(match = /^([a-zA-Z]+)\:/.exec(relativeUri)){
			this.scheme = Uri.schemes[match[1].toLowerCase()] || Uri.schemes.unknown;
		} else {
			$extend(this, new Uri(baseUri));
			var relative = this.scheme.relative;
			if(relative && relative.set){
				relative.set.apply(this, [relativeUri]);
				return this;
			}
		}
		return this.set('href', relativeUri);
	},
	
	get: function(part){
		var prop = this.scheme ? this.scheme[part] : false;
		return prop && prop.get ? prop.get.apply(this, $A(arguments).slice(1)) : this[part];
	},
	
	set: function(part, value){
		var args = $A(arguments).slice(1), prop = this.scheme ? this.scheme[part] : false;
		if(prop) prop.set.apply(this, args); else this[part] = value;
		return this;
	},
	
	getData: function(key){ var obj = this.get('data') || {}; return key ? obj[key] : obj; },
	setData: function(values, merge){
		if(typeof values == 'string' && typeof merge != undefined){
			var key = values;
			values = this.getData();
			values[key] = merge;
			merge = false;
		}
		return this.set('data', (merge ? $merge(this.getData(), values) : values) || {});
	},
	
	toAbsolute: function(baseUri){ return this.get('absolute', baseUri) || this.get('href'); },
	toRelative: function(baseUri){ return this.get('relative', baseUri) || this.get('href'); },

	toString: function(){ return this.get('href'); }
});

(function(){

	var matchThis = function(r, m){
		return function(v){
			var self = this, match = r.exec(v);
			if(match) m.each(function(k,i){ self[k] = match[i+1]; });
		};
	},
	dataProp = function(key){
		return {
			get: function(){
				var d = this.get(key);
				return d && d.length > 1 ? decodeURI(d.substr(1)).parseQueryString(false, false) : false; 
			},
			set: function(obj){
				var nq = '';
				for (var k in obj){
					if(nq != '') nq += '&';
					nq += encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]);
				}
				return this.set(key, nq != '' ? '?' + nq : nq);
			}
		};			
	};

	Uri.schemes = {
		http: {
			href: {
				get: function(){
					var uri = this, dp = Uri.defaultPorts[uri.protocol.substr(0, uri.protocol.length - 1).toLowerCase()];
					return uri.protocol + '//' + (uri.user ? uri.user + (uri.password ? ':' + uri.password : '') + '@' : '') +
						   (uri.hostname || '') + (uri.port && uri.port != dp ? ':' + uri.port : '') +
						   (uri.directory || '/') + (uri.file || '') + (uri.search || '') + (uri.hash || '');
				},
				set: function(value){
					var uri = this;
					matchThis(
						/^([a-zA-Z]+:)(?:\/\/(?:(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]+)?(?::(\d*))?)?((?:[^?#\/]*\/)*)([^?#]*)(\?[^#]*)?(#.*)?/,
						['protocol', 'user', 'password', 'hostname', 'port', 'directory', 'file', 'search', 'hash']
					).apply(uri, [value]);
					uri.port = uri.port || Uri.defaultPorts[uri.protocol.substr(0, uri.protocol.length - 1).toLowerCase()];
					uri.directory = uri.directory || '/';
				}
			},
			pathname: {
				get: function(uri){ return uri.directory + (uri.file || ''); },
				set: matchThis(/^([^\/]*)(.*)$/, ['directory', 'file'])
			},
			relative: {
				get: function(baseUri){
					var uri = this;
					baseUri = baseUri ? new Uri(this, baseUri) : new Uri();
					if(!uri.directory || !baseUri.directory || uri.protocol != baseUri.protocol || uri.hostname != baseUri.hostname || uri.port != baseUri.port)
						return uri.get('href');

					var b, r, p = '', o;
					b = baseUri.directory.split('/');
					r = uri.directory.split('/');
					
					for(o = 0; o < b.length && o < r.length && b[o] == r[o]; o++);
						
					for(var i = 0; i < b.length - o - 1; i++) p += "../";

					for(var i = o; i < r.length - 1; i++) p += r[i] + '/';
						
					return (p || (uri.file ? '' : './')) + (uri.file || '') + (uri.search || '') + (uri.hash || '');
				},
				set: function(value){
					var uri = this, odir = uri.directory;

					matchThis(/^(\.\.?$|(?:[^?#\/]*\/)*)([^?#]*)(\?[^#]*)?(#.*)?/, ['directory', 'file', 'search', 'hash']).apply(uri, [value]);
					
					var dir = uri.directory;
					if(dir){
						var b = !odir || /^\/.?/.test(dir) ? [] : odir.replace(/\/$/, '').split('/'),
							r = dir.replace(/\/$/, '').split('/');
						r.each(function(d, i){
							if(d == '..'){
								if(b.length > 1 || (b.length > 0 && b[0] != '')) b.pop();
							} else if(d != '.')
								b.push(d);
						});
						uri.directory = b.join('/') + '/';
					}
					else
						uri.directory = odir || '/';
				}
			},
			absolute: {
				get: function(baseUri){
					var uri = this;
					baseUri = baseUri ? new Uri(this, baseUri) : new Uri();
					if(!uri.directory || !baseUri.directory || uri.protocol != baseUri.protocol || uri.hostname != baseUri.hostname || uri.port != baseUri.port)
						return uri.get('href');
					return uri.directory + (uri.file || '') + (uri.search || '') + (uri.hash || '')
				}
			},
			data: dataProp('search')
		},
		mailto: {
			href: {
				get: function(){ return this.protocol + this.username + '@' + this.hostname + (this.headers || ''); },
				set: matchThis(/^([a-z]+:)([^\.:@]+(?:\.[^:@]+)*)@((?:[^?:\.]+\.)*[^?:\.]+)(\?.*)?/i, ['protocol', 'username', 'hostname', 'headers'])
			},
			email: {
				get: function(){ return this.username + '@' + this.hostname; },
				set: matchThis(/^([^\.:@]+(?:\.[^:@]+)*)@((?:[^?:\.]+\.)*[^?:\.]+)$/, ['username', 'hostname'])
			},
			subject: {
				get: function(){ return this.getData('subject'); },
				set: function(v){ this.setData('subject', v); }
			},
			body: {
				get: function(){ return this.getData('body'); },
				set: function(v){ this.setData('body', v); }
			},
			data: dataProp('headers')
		},
		javascript: {
			href: {
				get: function(uri){ return uri.protocol + (uri.script || '').toString().replace(/\r?\n/g, ' '); },
				set: matchThis(/^([a-z]+:)(.*)$/, ['protocol', 'script'])
			}
		},
		unknown: {}
	};

})();

Uri.schemes.http.absolute.set = Uri.schemes.http.relative.set;

Uri.validate = function(uri){
	for(var s in Uri.schemes) if(Uri.schemes[s].parse.test(uri)) return true;
	return false;
};

Uri.validate.mailto = function(uri){ return (/^mailto:/i).test(uri) && Uri.schemes.mailto.parse.test(uri); };
['http','https','ftp','file','rtsp','mms'].each(function(k){
	Uri.validate[k] = function(uri){ return new RegExp('^' + k + ':', 'i').test(uri) && Uri.schemes[k].parse.test(uri); };
	Uri.schemes[k] = Uri.schemes.http;
});

Uri.defaultPorts = { http: 80, https: 443, ftp: 21 };

String.implement({

	toUri: function(baseUri){
		return new Uri(baseUri, this);
	},
	
	parseQueryString: function(encodeKeys, encodeValues){
		encodeKeys = $pick(encodeKeys, true);
		encodeValues = $pick(encodeValues, true);
		var vars = this.split(/[&;]/), rs = {};
		if (vars.length) vars.each(function(val){
			var keys = val.split('=');
			if (keys.length && keys.length == 2){
				rs[(encodeKeys) ? encodeURIComponent(keys[0]):keys[0]] = (encodeValues) ? encodeURIComponent(keys[1]) : keys[1];
			}
		});
		return rs;
	},

	cleanQueryString: function(method){
		return this.split('&').filter(method || function(set){
			return $chk(set.split('=')[1]);
		}).join('&');
	}

});
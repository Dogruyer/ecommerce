var Prototype = {
	Version: "1.5.0",
	BrowserFeatures: {
		XPath: !!document.evaluate
	},
	ScriptFragment: "(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)",
	emptyFunction: function () {},
	K: function (x) {
		return x
	}
};
var Class = {
	create: function () {
		return function () {
			this.initialize.apply(this, arguments)
		}
	}
};
var Abstract = new Object();
Object.extend = function (destination, source) {
	for (var property in source) {
		destination[property] = source[property]
	}
	return destination
};
Object.extend(Object, {
	inspect: function (object) {
		try {
			if (object === undefined) {
				return "undefined"
			}
			if (object === null) {
				return "null"
			}
			return object.inspect ? object.inspect() : object.toString()
		} catch (e) {
			if (e instanceof RangeError) {
				return "..."
			}
			throw e
		}
	},
	keys: function (object) {
		var keys = [];
		for (var property in object) {
			keys.push(property)
		}
		return keys
	},
	values: function (object) {
		var values = [];
		for (var property in object) {
			values.push(object[property])
		}
		return values
	},
	clone: function (object) {
		return Object.extend({}, object)
	}
});
Function.prototype.bind = function () {
	var __method = this,
		args = $A(arguments),
		object = args.shift();
	return function () {
		return __method.apply(object, args.concat($A(arguments)))
	}
};
Function.prototype.bindAsEventListener = function (object) {
	var __method = this,
		args = $A(arguments),
		object = args.shift();
	return function (event) {
		return __method.apply(object, [(event || window.event)].concat(args).concat($A(arguments)))
	}
};
Object.extend(Number.prototype, {
	toColorPart: function () {
		var digits = this.toString(16);
		if (this < 16) {
			return "0" + digits
		}
		return digits
	},
	succ: function () {
		return this + 1
	},
	times: function (iterator) {
		$R(0, this, true).each(iterator);
		return this
	}
});
var Try = {
	these: function () {
		var returnValue;
		for (var i = 0, length = arguments.length; i < length; i++) {
			var lambda = arguments[i];
			try {
				returnValue = lambda();
				break
			} catch (e) {}
		}
		return returnValue
	}
};
var PeriodicalExecuter = Class.create();
PeriodicalExecuter.prototype = {
	initialize: function (callback, frequency) {
		this.callback = callback;
		this.frequency = frequency;
		this.currentlyExecuting = false;
		this.registerCallback()
	},
	registerCallback: function () {
		this.timer = setInterval(this.onTimerEvent.bind(this), this.frequency * 1000)
	},
	stop: function () {
		if (!this.timer) {
			return
		}
		clearInterval(this.timer);
		this.timer = null
	},
	onTimerEvent: function () {
		if (!this.currentlyExecuting) {
			try {
				this.currentlyExecuting = true;
				this.callback(this)
			} finally {
				this.currentlyExecuting = false
			}
		}
	}
};
String.interpret = function (value) {
	return value == null ? "" : String(value)
};
Object.extend(String.prototype, {
	gsub: function (pattern, replacement) {
		var result = "",
			source = this,
			match;
		replacement = arguments.callee.prepareReplacement(replacement);
		while (source.length > 0) {
			if (match = source.match(pattern)) {
				result += source.slice(0, match.index);
				result += String.interpret(replacement(match));
				source = source.slice(match.index + match[0].length)
			} else {
				result += source, source = ""
			}
		}
		return result
	},
	sub: function (pattern, replacement, count) {
		replacement = this.gsub.prepareReplacement(replacement);
		count = count === undefined ? 1 : count;
		return this.gsub(pattern, function (match) {
			if (--count < 0) {
				return match[0]
			}
			return replacement(match)
		})
	},
	scan: function (pattern, iterator) {
		this.gsub(pattern, iterator);
		return this
	},
	truncate: function (length, truncation) {
		length = length || 30;
		truncation = truncation === undefined ? "..." : truncation;
		return this.length > length ? this.slice(0, length - truncation.length) + truncation : this
	},
	strip: function () {
		return this.replace(/^\s+/, "").replace(/\s+$/, "")
	},
	stripTags: function () {
		return this.replace(/<\/?[^>]+>/gi, "")
	},
	stripScripts: function () {
		return this.replace(new RegExp(Prototype.ScriptFragment, "img"), "")
	},
	extractScripts: function () {
		var matchAll = new RegExp(Prototype.ScriptFragment, "img");
		var matchOne = new RegExp(Prototype.ScriptFragment, "im");
		return (this.match(matchAll) || []).map(function (scriptTag) {
			return (scriptTag.match(matchOne) || ["", ""])[1]
		})
	},
	evalScripts: function () {
		return this.extractScripts().map(function (script) {
			return eval(script)
		})
	},
	escapeHTML: function () {
		var div = document.createElement("div");
		var text = document.createTextNode(this);
		div.appendChild(text);
		return div.innerHTML
	},
	unescapeHTML: function () {
		var div = document.createElement("div");
		div.innerHTML = this.stripTags();
		return div.childNodes[0] ? (div.childNodes.length > 1 ? $A(div.childNodes).inject("", function (memo, node) {
			return memo + node.nodeValue
		}) : div.childNodes[0].nodeValue) : ""
	},
	toQueryParams: function (separator) {
		var match = this.strip().match(/([^?#]*)(#.*)?$/);
		if (!match) {
			return {}
		}
		return match[1].split(separator || "&").inject({}, function (hash, pair) {
			if ((pair = pair.split("="))[0]) {
				var name = decodeURIComponent(pair[0]);
				var value = pair[1] ? decodeURIComponent(pair[1]) : undefined;
				if (hash[name] !== undefined) {
					if (hash[name].constructor != Array) {
						hash[name] = [hash[name]]
					}
					if (value) {
						hash[name].push(value)
					}
				} else {
					hash[name] = value
				}
			}
			return hash
		})
	},
	toArray: function () {
		return this.split("")
	},
	succ: function () {
		return this.slice(0, this.length - 1) + String.fromCharCode(this.charCodeAt(this.length - 1) + 1)
	},
	camelize: function () {
		var parts = this.split("-"),
			len = parts.length;
		if (len == 1) {
			return parts[0]
		}
		var camelized = this.charAt(0) == "-" ? parts[0].charAt(0).toUpperCase() + parts[0].substring(1) : parts[0];
		for (var i = 1; i < len; i++) {
			camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1)
		}
		return camelized
	},
	capitalize: function () {
		return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase()
	},
	underscore: function () {
		return this.gsub(/::/, "/").gsub(/([A-Z]+)([A-Z][a-z])/, "#{1}_#{2}").gsub(/([a-z\d])([A-Z])/, "#{1}_#{2}").gsub(/-/, "_").toLowerCase()
	},
	dasherize: function () {
		return this.gsub(/_/, "-")
	},
	inspect: function (useDoubleQuotes) {
		var escapedString = this.replace(/\\/g, "\\\\");
		if (useDoubleQuotes) {
			return '"' + escapedString.replace(/"/g, '\\"') + '"'
		} else {
			return "'" + escapedString.replace(/'/g, "\\'") + "'"
		}
	}
});
String.prototype.gsub.prepareReplacement = function (replacement) {
	if (typeof replacement == "function") {
		return replacement
	}
	var template = new Template(replacement);
	return function (match) {
		return template.evaluate(match)
	}
};
String.prototype.parseQuery = String.prototype.toQueryParams;
var Template = Class.create();
Template.Pattern = /(^|.|\r|\n)(#\{(.*?)\})/;
Template.prototype = {
	initialize: function (template, pattern) {
		this.template = template.toString();
		this.pattern = pattern || Template.Pattern
	},
	evaluate: function (object) {
		return this.template.gsub(this.pattern, function (match) {
			var before = match[1];
			if (before == "\\") {
				return match[2]
			}
			return before + String.interpret(object[match[3]])
		})
	}
};
var $break = new Object();
var $continue = new Object();
var Enumerable = {
	each: function (iterator) {
		var index = 0;
		try {
			this._each(function (value) {
				try {
					iterator(value, index++)
				} catch (e) {
					if (e != $continue) {
						throw e
					}
				}
			})
		} catch (e) {}
		return this
	},
	eachSlice: function (number, iterator) {
		var index = -number,
			slices = [],
			array = this.toArray();
		while ((index += number) < array.length) {
			slices.push(array.slice(index, index + number))
		}
		return slices.map(iterator)
	},
	all: function (iterator) {
		var result = true;
		this.each(function (value, index) {
			result = result && !!(iterator || Prototype.K)(value, index);
			if (!result) {
				throw $break
			}
		});
		return result
	},
	any: function (iterator) {
		var result = false;
		this.each(function (value, index) {
			if (result = !!(iterator || Prototype.K)(value, index)) {
				throw $break
			}
		});
		return result
	},
	collect: function (iterator) {
		var results = [];
		this.each(function (value, index) {
			results.push((iterator || Prototype.K)(value, index))
		});
		return results
	},
	detect: function (iterator) {
		var result;
		this.each(function (value, index) {
			if (iterator(value, index)) {
				result = value;
				throw $break
			}
		});
		return result
	},
	findAll: function (iterator) {
		var results = [];
		this.each(function (value, index) {
			if (iterator(value, index)) {
				results.push(value)
			}
		});
		return results
	},
	grep: function (pattern, iterator) {
		var results = [];
		this.each(function (value, index) {
			var stringValue = value.toString();
			if (stringValue.match(pattern)) {
				results.push((iterator || Prototype.K)(value, index))
			}
		});
		return results
	},
	include: function (object) {
		var found = false;
		this.each(function (value) {
			if (value == object) {
				found = true;
				throw $break
			}
		});
		return found
	},
	inGroupsOf: function (number, fillWith) {
		fillWith = fillWith === undefined ? null : fillWith;
		return this.eachSlice(number, function (slice) {
			while (slice.length < number) {
				slice.push(fillWith)
			}
			return slice
		})
	},
	inject: function (memo, iterator) {
		this.each(function (value, index) {
			memo = iterator(memo, value, index)
		});
		return memo
	},
	invoke: function (method) {
		var args = $A(arguments).slice(1);
		return this.map(function (value) {
			return value[method].apply(value, args)
		})
	},
	max: function (iterator) {
		var result;
		this.each(function (value, index) {
			value = (iterator || Prototype.K)(value, index);
			if (result == undefined || value >= result) {
				result = value
			}
		});
		return result
	},
	min: function (iterator) {
		var result;
		this.each(function (value, index) {
			value = (iterator || Prototype.K)(value, index);
			if (result == undefined || value < result) {
				result = value
			}
		});
		return result
	},
	partition: function (iterator) {
		var trues = [],
			falses = [];
		this.each(function (value, index) {
			((iterator || Prototype.K)(value, index) ? trues : falses).push(value)
		});
		return [trues, falses]
	},
	pluck: function (property) {
		var results = [];
		this.each(function (value, index) {
			results.push(value[property])
		});
		return results
	},
	reject: function (iterator) {
		var results = [];
		this.each(function (value, index) {
			if (!iterator(value, index)) {
				results.push(value)
			}
		});
		return results
	},
	sortBy: function (iterator) {
		return this.map(function (value, index) {
			return {
				value: value,
				criteria: iterator(value, index)
			}
		}).sort(function (left, right) {
			var a = left.criteria,
				b = right.criteria;
			return a < b ? -1 : a > b ? 1 : 0
		}).pluck("value")
	},
	toArray: function () {
		return this.map()
	},
	zip: function () {
		var iterator = Prototype.K,
			args = $A(arguments);
		if (typeof args.last() == "function") {
			iterator = args.pop()
		}
		var collections = [this].concat(args).map($A);
		return this.map(function (value, index) {
			return iterator(collections.pluck(index))
		})
	},
	size: function () {
		return this.toArray().length
	},
	inspect: function () {
		return "#<Enumerable:" + this.toArray().inspect() + ">"
	}
};
Object.extend(Enumerable, {
	map: Enumerable.collect,
	find: Enumerable.detect,
	select: Enumerable.findAll,
	member: Enumerable.include,
	entries: Enumerable.toArray
});
var $A = Array.from = function (iterable) {
	if (!iterable) {
		return []
	}
	if (iterable.toArray) {
		return iterable.toArray()
	} else {
		var results = [];
		for (var i = 0, length = iterable.length; i < length; i++) {
			results.push(iterable[i])
		}
		return results
	}
};
Object.extend(Array.prototype, Enumerable);
if (!Array.prototype._reverse) {
	Array.prototype._reverse = Array.prototype.reverse
}
Object.extend(Array.prototype, {
	_each: function (iterator) {
		for (var i = 0, length = this.length; i < length; i++) {
			iterator(this[i])
		}
	},
	clear: function () {
		this.length = 0;
		return this
	},
	first: function () {
		return this[0]
	},
	last: function () {
		return this[this.length - 1]
	},
	compact: function () {
		return this.select(function (value) {
			return value != null
		})
	},
	flatten: function () {
		return this.inject([], function (array, value) {
			return array.concat(value && value.constructor == Array ? value.flatten() : [value])
		})
	},
	without: function () {
		var values = $A(arguments);
		return this.select(function (value) {
			return !values.include(value)
		})
	},
	indexOf: function (object) {
		for (var i = 0, length = this.length; i < length; i++) {
			if (this[i] == object) {
				return i
			}
		}
		return -1
	},
	reverse: function (inline) {
		return (inline !== false ? this : this.toArray())._reverse()
	},
	reduce: function () {
		return this.length > 1 ? this : this[0]
	},
	uniq: function () {
		return this.inject([], function (array, value) {
			return array.include(value) ? array : array.concat([value])
		})
	},
	clone: function () {
		return [].concat(this)
	},
	size: function () {
		return this.length
	},
	inspect: function () {
		return "[" + this.map(Object.inspect).join(", ") + "]"
	}
});
Array.prototype.toArray = Array.prototype.clone;

function $w(string) {
	string = string.strip();
	return string ? string.split(/\s+/) : []
}
if (window.opera) {
	Array.prototype.concat = function () {
		var array = [];
		for (var i = 0, length = this.length; i < length; i++) {
			array.push(this[i])
		}
		for (var i = 0, length = arguments.length; i < length; i++) {
			if (arguments[i].constructor == Array) {
				for (var j = 0, arrayLength = arguments[i].length; j < arrayLength; j++) {
					array.push(arguments[i][j])
				}
			} else {
				array.push(arguments[i])
			}
		}
		return array
	}
}
var Hash = function (obj) {
	Object.extend(this, obj || {})
};
Object.extend(Hash, {
	toQueryString: function (obj) {
		var parts = [];
		this.prototype._each.call(obj, function (pair) {
			if (!pair.key) {
				return
			}
			if (pair.value && pair.value.constructor == Array) {
				var values = pair.value.compact();
				if (values.length < 2) {
					pair.value = values.reduce()
				} else {
					key = encodeURIComponent(pair.key);
					values.each(function (value) {
						value = value != undefined ? encodeURIComponent(value) : "";
						parts.push(key + "=" + encodeURIComponent(value))
					});
					return
				}
			}
			if (pair.value == undefined) {
				pair[1] = ""
			}
			parts.push(pair.map(encodeURIComponent).join("="))
		});
		return parts.join("&")
	}
});
Object.extend(Hash.prototype, Enumerable);
Object.extend(Hash.prototype, {
	_each: function (iterator) {
		for (var key in this) {
			var value = this[key];
			if (value && value == Hash.prototype[key]) {
				continue
			}
			var pair = [key, value];
			pair.key = key;
			pair.value = value;
			iterator(pair)
		}
	},
	keys: function () {
		return this.pluck("key")
	},
	values: function () {
		return this.pluck("value")
	},
	merge: function (hash) {
		return $H(hash).inject(this, function (mergedHash, pair) {
			mergedHash[pair.key] = pair.value;
			return mergedHash
		})
	},
	remove: function () {
		var result;
		for (var i = 0, length = arguments.length; i < length; i++) {
			var value = this[arguments[i]];
			if (value !== undefined) {
				if (result === undefined) {
					result = value
				} else {
					if (result.constructor != Array) {
						result = [result]
					}
					result.push(value)
				}
			}
			delete this[arguments[i]]
		}
		return result
	},
	toQueryString: function () {
		return Hash.toQueryString(this)
	},
	inspect: function () {
		return "#<Hash:{" + this.map(function (pair) {
			return pair.map(Object.inspect).join(": ")
		}).join(", ") + "}>"
	}
});

function $H(object) {
	if (object && object.constructor == Hash) {
		return object
	}
	return new Hash(object)
}
ObjectRange = Class.create();
Object.extend(ObjectRange.prototype, Enumerable);
Object.extend(ObjectRange.prototype, {
	initialize: function (start, end, exclusive) {
		this.start = start;
		this.end = end;
		this.exclusive = exclusive
	},
	_each: function (iterator) {
		var value = this.start;
		while (this.include(value)) {
			iterator(value);
			value = value.succ()
		}
	},
	include: function (value) {
		if (value < this.start) {
			return false
		}
		if (this.exclusive) {
			return value < this.end
		}
		return value <= this.end
	}
});
var $R = function (start, end, exclusive) {
	return new ObjectRange(start, end, exclusive)
};
var Ajax = {
	getTransport: function () {
		return Try.these(function () {
			return new XMLHttpRequest()
		}, function () {
			return new ActiveXObject("Msxml2.XMLHTTP")
		}, function () {
			return new ActiveXObject("Microsoft.XMLHTTP")
		}) || false
	},
	activeRequestCount: 0
};
Ajax.Responders = {
	responders: [],
	_each: function (iterator) {
		this.responders._each(iterator)
	},
	register: function (responder) {
		if (!this.include(responder)) {
			this.responders.push(responder)
		}
	},
	unregister: function (responder) {
		this.responders = this.responders.without(responder)
	},
	dispatch: function (callback, request, transport, json) {
		this.each(function (responder) {
			if (typeof responder[callback] == "function") {
				try {
					responder[callback].apply(responder, [request, transport, json])
				} catch (e) {}
			}
		})
	}
};
Object.extend(Ajax.Responders, Enumerable);
Ajax.Responders.register({
	onCreate: function () {
		Ajax.activeRequestCount++
	},
	onComplete: function () {
		Ajax.activeRequestCount--
	}
});
Ajax.Base = function () {};
Ajax.Base.prototype = {
	setOptions: function (options) {
		this.options = {
			method: "post",
			asynchronous: true,
			contentType: "application/x-www-form-urlencoded",
			encoding: "UTF-8",
			parameters: ""
		};
		Object.extend(this.options, options || {});
		this.options.method = this.options.method.toLowerCase();
		if (typeof this.options.parameters == "string") {
			this.options.parameters = this.options.parameters.toQueryParams()
		}
	}
};
Ajax.Request = Class.create();
Ajax.Request.Events = ["Uninitialized", "Loading", "Loaded", "Interactive", "Complete"];
Ajax.Request.prototype = Object.extend(new Ajax.Base(), {
	_complete: false,
	initialize: function (url, options) {
		this.transport = Ajax.getTransport();
		this.setOptions(options);
		this.request(url)
	},
	request: function (url) {
		this.url = url;
		this.method = this.options.method;
		var params = this.options.parameters;
		if (!["get", "post"].include(this.method)) {
			params["_method"] = this.method;
			this.method = "post"
		}
		params = Hash.toQueryString(params);
		if (params && /Konqueror|Safari|KHTML/.test(navigator.userAgent)) {
			params += "&_="
		}
		if (this.method == "get" && params) {
			this.url += (this.url.indexOf("?") > -1 ? "&" : "?") + params
		}
		try {
			Ajax.Responders.dispatch("onCreate", this, this.transport);
			this.transport.open(this.method.toUpperCase(), this.url, this.options.asynchronous);
			if (this.options.asynchronous) {
				setTimeout(function () {
					this.respondToReadyState(1)
				}.bind(this), 10)
			}
			this.transport.onreadystatechange = this.onStateChange.bind(this);
			this.setRequestHeaders();
			var body = this.method == "post" ? (this.options.postBody || params) : null;
			this.transport.send(body);
			if (!this.options.asynchronous && this.transport.overrideMimeType) {
				this.onStateChange()
			}
		} catch (e) {
			this.dispatchException(e)
		}
	},
	onStateChange: function () {
		var readyState = this.transport.readyState;
		if (readyState > 1 && !((readyState == 4) && this._complete)) {
			this.respondToReadyState(this.transport.readyState)
		}
	},
	setRequestHeaders: function () {
		var headers = {
			"X-Requested-With": "XMLHttpRequest",
			"X-Prototype-Version": Prototype.Version,
			"Accept": "text/javascript, text/html, application/xml, text/xml, */*"
		};
		if (this.method == "post") {
			headers["Content-type"] = this.options.contentType + (this.options.encoding ? "; charset=" + this.options.encoding : "");
			if (this.transport.overrideMimeType && (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0, 2005])[1] < 2005) {
				headers["Connection"] = "close"
			}
		}
		if (typeof this.options.requestHeaders == "object") {
			var extras = this.options.requestHeaders;
			if (typeof extras.push == "function") {
				for (var i = 0, length = extras.length; i < length; i += 2) {
					headers[extras[i]] = extras[i + 1]
				}
			} else {
				$H(extras).each(function (pair) {
					headers[pair.key] = pair.value
				})
			}
		}
		for (var name in headers) {
			this.transport.setRequestHeader(name, headers[name])
		}
	},
	success: function () {
		return !this.transport.status || (this.transport.status >= 200 && this.transport.status < 300)
	},
	respondToReadyState: function (readyState) {
		var state = Ajax.Request.Events[readyState];
		var transport = this.transport,
			json = this.evalJSON();
		if (state == "Complete") {
			try {
				this._complete = true;
				(this.options["on" + this.transport.status] || this.options["on" + (this.success() ? "Success" : "Failure")] || Prototype.emptyFunction)(transport, json)
			} catch (e) {
				this.dispatchException(e)
			}
			if ((this.getHeader("Content-type") || "text/javascript").strip().match(/^(text|application)\/(x-)?(java|ecma)script(;.*)?$/i)) {
				this.evalResponse()
			}
		}
		try {
			(this.options["on" + state] || Prototype.emptyFunction)(transport, json);
			Ajax.Responders.dispatch("on" + state, this, transport, json)
		} catch (e) {
			this.dispatchException(e)
		}
		if (state == "Complete") {
			this.transport.onreadystatechange = Prototype.emptyFunction
		}
	},
	getHeader: function (name) {
		try {
			return this.transport.getResponseHeader(name)
		} catch (e) {
			return null
		}
	},
	evalJSON: function () {
		try {
			var json = this.getHeader("X-JSON");
			return json ? eval("(" + json + ")") : null
		} catch (e) {
			return null
		}
	},
	evalResponse: function () {
		try {
			return eval(this.transport.responseText)
		} catch (e) {
			this.dispatchException(e)
		}
	},
	dispatchException: function (exception) {
		(this.options.onException || Prototype.emptyFunction)(this, exception);
		Ajax.Responders.dispatch("onException", this, exception)
	}
});
Ajax.Updater = Class.create();
Object.extend(Object.extend(Ajax.Updater.prototype, Ajax.Request.prototype), {
	initialize: function (container, url, options) {
		this.container = {
			success: (container.success || container),
			failure: (container.failure || (container.success ? null : container))
		};
		this.transport = Ajax.getTransport();
		this.setOptions(options);
		var onComplete = this.options.onComplete || Prototype.emptyFunction;
		this.options.onComplete = (function (transport, param) {
			this.updateContent();
			onComplete(transport, param)
		}).bind(this);
		this.request(url)
	},
	updateContent: function () {
		var receiver = this.container[this.success() ? "success" : "failure"];
		var response = this.transport.responseText;
		if (!this.options.evalScripts) {
			response = response.stripScripts()
		}
		if (receiver = $(receiver)) {
			if (this.options.insertion) {
				new this.options.insertion(receiver, response)
			} else {
				receiver.update(response)
			}
		}
		if (this.success()) {
			if (this.onComplete) {
				setTimeout(this.onComplete.bind(this), 10)
			}
		}
	}
});
Ajax.PeriodicalUpdater = Class.create();
Ajax.PeriodicalUpdater.prototype = Object.extend(new Ajax.Base(), {
	initialize: function (container, url, options) {
		this.setOptions(options);
		this.onComplete = this.options.onComplete;
		this.frequency = (this.options.frequency || 2);
		this.decay = (this.options.decay || 1);
		this.updater = {};
		this.container = container;
		this.url = url;
		this.start()
	},
	start: function () {
		this.options.onComplete = this.updateComplete.bind(this);
		this.onTimerEvent()
	},
	stop: function () {
		this.updater.options.onComplete = undefined;
		clearTimeout(this.timer);
		(this.onComplete || Prototype.emptyFunction).apply(this, arguments)
	},
	updateComplete: function (request) {
		if (this.options.decay) {
			this.decay = (request.responseText == this.lastText ? this.decay * this.options.decay : 1);
			this.lastText = request.responseText
		}
		this.timer = setTimeout(this.onTimerEvent.bind(this), this.decay * this.frequency * 1000)
	},
	onTimerEvent: function () {
		this.updater = new Ajax.Updater(this.container, this.url, this.options)
	}
});

function $(element) {
	if (arguments.length > 1) {
		for (var i = 0, elements = [], length = arguments.length; i < length; i++) {
			elements.push($(arguments[i]))
		}
		return elements
	}
	if (typeof element == "string") {
		element = document.getElementById(element)
	}
	return Element.extend(element)
}
if (Prototype.BrowserFeatures.XPath) {
	document._getElementsByXPath = function (expression, parentElement) {
		var results = [];
		var query = document.evaluate(expression, $(parentElement) || document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		for (var i = 0, length = query.snapshotLength; i < length; i++) {
			results.push(query.snapshotItem(i))
		}
		return results
	}
}
document.getElementsByClassName = function (className, parentElement) {
	if (Prototype.BrowserFeatures.XPath) {
		var q = ".//*[contains(concat(' ', @class, ' '), ' " + className + " ')]";
		return document._getElementsByXPath(q, parentElement)
	} else {
		var children = ($(parentElement) || document.body).getElementsByTagName("*");
		var elements = [],
			child;
		for (var i = 0, length = children.length; i < length; i++) {
			child = children[i];
			if (Element.hasClassName(child, className)) {
				elements.push(Element.extend(child))
			}
		}
		return elements
	}
};
if (!window.Element) {
	var Element = new Object()
}
Element.extend = function (element) {
	if (!element || _nativeExtensions || element.nodeType == 3) {
		return element
	}
	if (!element._extended && element.tagName && element != window) {
		var methods = Object.clone(Element.Methods),
			cache = Element.extend.cache;
		if (element.tagName == "FORM") {
			Object.extend(methods, Form.Methods)
		}
		if (["INPUT", "TEXTAREA", "SELECT"].include(element.tagName)) {
			Object.extend(methods, Form.Element.Methods)
		}
		Object.extend(methods, Element.Methods.Simulated);
		for (var property in methods) {
			var value = methods[property];
			if (typeof value == "function" && !(property in element)) {
				element[property] = cache.findOrStore(value)
			}
		}
	}
	element._extended = true;
	return element
};
Element.extend.cache = {
	findOrStore: function (value) {
		return this[value] = this[value] || function () {
			return value.apply(null, [this].concat($A(arguments)))
		}
	}
};
Element.Methods = {
	visible: function (element) {
		return $(element).style.display != "none"
	},
	toggle: function (element) {
		element = $(element);
		Element[Element.visible(element) ? "hide" : "show"](element);
		return element
	},
	hide: function (element) {
		$(element).style.display = "none";
		return element
	},
	show: function (element) {
		$(element).style.display = "";
		return element
	},
	remove: function (element) {
		element = $(element);
		element.parentNode.removeChild(element);
		return element
	},
	update: function (element, html) {
		html = typeof html == "undefined" ? "" : html.toString();
		$(element).innerHTML = html.stripScripts();
		setTimeout(function () {
			html.evalScripts()
		}, 10);
		return element
	},
	replace: function (element, html) {
		element = $(element);
		html = typeof html == "undefined" ? "" : html.toString();
		if (element.outerHTML) {
			element.outerHTML = html.stripScripts()
		} else {
			var range = element.ownerDocument.createRange();
			range.selectNodeContents(element);
			element.parentNode.replaceChild(range.createContextualFragment(html.stripScripts()), element)
		}
		setTimeout(function () {
			html.evalScripts()
		}, 10);
		return element
	},
	inspect: function (element) {
		element = $(element);
		var result = "<" + element.tagName.toLowerCase();
		$H({
			"id": "id",
			"className": "class"
		}).each(function (pair) {
			var property = pair.first(),
				attribute = pair.last();
			var value = (element[property] || "").toString();
			if (value) {
				result += " " + attribute + "=" + value.inspect(true)
			}
		});
		return result + ">"
	},
	recursivelyCollect: function (element, property) {
		element = $(element);
		var elements = [];
		while (element = element[property]) {
			if (element.nodeType == 1) {
				elements.push(Element.extend(element))
			}
		}
		return elements
	},
	ancestors: function (element) {
		return $(element).recursivelyCollect("parentNode")
	},
	descendants: function (element) {
		return $A($(element).getElementsByTagName("*"))
	},
	immediateDescendants: function (element) {
		if (!(element = $(element).firstChild)) {
			return []
		}
		while (element && element.nodeType != 1) {
			element = element.nextSibling
		}
		if (element) {
			return [element].concat($(element).nextSiblings())
		}
		return []
	},
	previousSiblings: function (element) {
		return $(element).recursivelyCollect("previousSibling")
	},
	nextSiblings: function (element) {
		return $(element).recursivelyCollect("nextSibling")
	},
	siblings: function (element) {
		element = $(element);
		return element.previousSiblings().reverse().concat(element.nextSiblings())
	},
	match: function (element, selector) {
		if (typeof selector == "string") {
			selector = new Selector(selector)
		}
		return selector.match($(element))
	},
	up: function (element, expression, index) {
		return Selector.findElement($(element).ancestors(), expression, index)
	},
	down: function (element, expression, index) {
		return Selector.findElement($(element).descendants(), expression, index)
	},
	previous: function (element, expression, index) {
		return Selector.findElement($(element).previousSiblings(), expression, index)
	},
	next: function (element, expression, index) {
		return Selector.findElement($(element).nextSiblings(), expression, index)
	},
	getElementsBySelector: function () {
		var args = $A(arguments),
			element = $(args.shift());
		return Selector.findChildElements(element, args)
	},
	getElementsByClassName: function (element, className) {
		return document.getElementsByClassName(className, element)
	},
	readAttribute: function (element, name) {
		element = $(element);
		if (document.all && !window.opera) {
			var t = Element._attributeTranslations;
			if (t.values[name]) {
				return t.values[name](element, name)
			}
			if (t.names[name]) {
				name = t.names[name]
			}
			var attribute = element.attributes[name];
			if (attribute) {
				return attribute.nodeValue
			}
		}
		return element.getAttribute(name)
	},
	getHeight: function (element) {
		return $(element).getDimensions().height
	},
	getWidth: function (element) {
		return $(element).getDimensions().width
	},
	classNames: function (element) {
		return new Element.ClassNames(element)
	},
	hasClassName: function (element, className) {
		if (!(element = $(element))) {
			return
		}
		var elementClassName = element.className;
		if (elementClassName.length == 0) {
			return false
		}
		try {
			if (elementClassName == className || elementClassName.match(new RegExp("(^|\\s)" + className + "(\\s|$)"))) {
				return true
			}
		} catch (e) {}
		return false
	},
	addClassName: function (element, className) {
		if (!(element = $(element))) {
			return
		}
		Element.classNames(element).add(className);
		return element
	},
	removeClassName: function (element, className) {
		if (!(element = $(element))) {
			return
		}
		Element.classNames(element).remove(className);
		return element
	},
	toggleClassName: function (element, className) {
		if (!(element = $(element))) {
			return
		}
		Element.classNames(element)[element.hasClassName(className) ? "remove" : "add"](className);
		return element
	},
	observe: function () {
		Event.observe.apply(Event, arguments);
		return $A(arguments).first()
	},
	stopObserving: function () {
		Event.stopObserving.apply(Event, arguments);
		return $A(arguments).first()
	},
	cleanWhitespace: function (element) {
		element = $(element);
		var node = element.firstChild;
		while (node) {
			var nextNode = node.nextSibling;
			if (node.nodeType == 3 && !/\S/.test(node.nodeValue)) {
				element.removeChild(node)
			}
			node = nextNode
		}
		return element
	},
	empty: function (element) {
		return $(element).innerHTML.match(/^\s*$/)
	},
	descendantOf: function (element, ancestor) {
		element = $(element), ancestor = $(ancestor);
		while (element = element.parentNode) {
			if (element == ancestor) {
				return true
			}
		}
		return false
	},
	scrollTo: function (element) {
		element = $(element);
		var pos = Position.cumulativeOffset(element);
		window.scrollTo(pos[0], pos[1]);
		return element
	},
	getStyle: function (element, style) {
		element = $(element);
		if (["float", "cssFloat"].include(style)) {
			style = (typeof element.style.styleFloat != "undefined" ? "styleFloat" : "cssFloat")
		}
		style = style.camelize();
		var value = element.style[style];
		if (!value) {
			if (document.defaultView && document.defaultView.getComputedStyle) {
				var css = document.defaultView.getComputedStyle(element, null);
				value = css ? css[style] : null
			} else {
				if (element.currentStyle) {
					value = element.currentStyle[style]
				}
			}
		}
		if ((value == "auto") && ["width", "height"].include(style) && (element.getStyle("display") != "none")) {
			value = element["offset" + style.capitalize()] + "px"
		}
		if (window.opera && ["left", "top", "right", "bottom"].include(style)) {
			if (Element.getStyle(element, "position") == "static") {
				value = "auto"
			}
		}
		if (style == "opacity") {
			if (value) {
				return parseFloat(value)
			}
			if (value = (element.getStyle("filter") || "").match(/alpha\(opacity=(.*)\)/)) {
				if (value[1]) {
					return parseFloat(value[1]) / 100
				}
			}
			return 1
		}
		return value == "auto" ? null : value
	},
	setStyle: function (element, style) {
		element = $(element);
		for (var name in style) {
			var value = style[name];
			if (name == "opacity") {
				if (value == 1) {
					value = (/Gecko/.test(navigator.userAgent) && !/Konqueror|Safari|KHTML/.test(navigator.userAgent)) ? 0.999999 : 1;
					if (/MSIE/.test(navigator.userAgent) && !window.opera && element.getStyle("filter") != undefined) {
						element.style.filter = element.getStyle("filter").replace(/alpha\([^\)]*\)/gi, "")
					}
				} else {
					if (value === "") {
						if (/MSIE/.test(navigator.userAgent) && !window.opera && element.getStyle("filter") != undefined) {
							element.style.filter = element.getStyle("filter").replace(/alpha\([^\)]*\)/gi, "")
						}
					} else {
						if (value < 0.00001) {
							value = 0
						}
						if (/MSIE/.test(navigator.userAgent) && !window.opera && element.getStyle("filter") != undefined) {
							element.style.filter = element.getStyle("filter").replace(/alpha\([^\)]*\)/gi, "") + "alpha(opacity=" + value * 100 + ")"
						}
					}
				}
			} else {
				if (["float", "cssFloat"].include(name)) {
					name = (typeof element.style.styleFloat != "undefined") ? "styleFloat" : "cssFloat"
				}
			}
			element.style[name.camelize()] = value
		}
		return element
	},
	getDimensions: function (element) {
		element = $(element);
		var display = $(element).getStyle("display");
		if (display != "none" && display != null) {
			return {
				width: element.offsetWidth,
				height: element.offsetHeight
			}
		}
		var els = element.style;
		var originalVisibility = els.visibility;
		var originalPosition = els.position;
		var originalDisplay = els.display;
		els.visibility = "hidden";
		els.position = "absolute";
		els.display = "block";
		var originalWidth = element.clientWidth;
		var originalHeight = element.clientHeight;
		els.display = originalDisplay;
		els.position = originalPosition;
		els.visibility = originalVisibility;
		return {
			width: originalWidth,
			height: originalHeight
		}
	},
	makePositioned: function (element) {
		element = $(element);
		var pos = Element.getStyle(element, "position");
		if (pos == "static" || !pos) {
			element._madePositioned = true;
			element.style.position = "relative";
			if (window.opera) {
				element.style.top = 0;
				element.style.left = 0
			}
		}
		return element
	},
	undoPositioned: function (element) {
		element = $(element);
		if (element._madePositioned) {
			element._madePositioned = undefined;
			element.style.position = element.style.top = element.style.left = element.style.bottom = element.style.right = ""
		}
		return element
	},
	makeClipping: function (element) {
		element = $(element);
		if (element._overflow) {
			return element
		}
		element._overflow = element.style.overflow || "auto";
		if ((Element.getStyle(element, "overflow") || "visible") != "hidden") {
			element.style.overflow = "hidden"
		}
		return element
	},
	undoClipping: function (element) {
		element = $(element);
		if (!element._overflow) {
			return element
		}
		element.style.overflow = element._overflow == "auto" ? "" : element._overflow;
		element._overflow = null;
		return element
	}
};
Object.extend(Element.Methods, {
	childOf: Element.Methods.descendantOf
});
Element._attributeTranslations = {};
Element._attributeTranslations.names = {
	colspan: "colSpan",
	rowspan: "rowSpan",
	valign: "vAlign",
	datetime: "dateTime",
	accesskey: "accessKey",
	tabindex: "tabIndex",
	enctype: "encType",
	maxlength: "maxLength",
	readonly: "readOnly",
	longdesc: "longDesc"
};
Element._attributeTranslations.values = {
	_getAttr: function (element, attribute) {
		return element.getAttribute(attribute, 2)
	},
	_flag: function (element, attribute) {
		return $(element).hasAttribute(attribute) ? attribute : null
	},
	style: function (element) {
		return element.style.cssText.toLowerCase()
	},
	title: function (element) {
		var node = element.getAttributeNode("title");
		return node.specified ? node.nodeValue : null
	}
};
Object.extend(Element._attributeTranslations.values, {
	href: Element._attributeTranslations.values._getAttr,
	src: Element._attributeTranslations.values._getAttr,
	disabled: Element._attributeTranslations.values._flag,
	checked: Element._attributeTranslations.values._flag,
	readonly: Element._attributeTranslations.values._flag,
	multiple: Element._attributeTranslations.values._flag
});
Element.Methods.Simulated = {
	hasAttribute: function (element, attribute) {
		var t = Element._attributeTranslations;
		attribute = t.names[attribute] || attribute;
		return $(element).getAttributeNode(attribute).specified
	}
};
if (document.all && !window.opera) {
	Element.Methods.update = function (element, html) {
		element = $(element);
		html = typeof html == "undefined" ? "" : html.toString();
		var tagName = element.tagName.toUpperCase();
		if (["THEAD", "TBODY", "TR", "TD"].include(tagName)) {
			var div = document.createElement("div");
			switch (tagName) {
				case "THEAD":
				case "TBODY":
					div.innerHTML = "<table><tbody>" + html.stripScripts() + "</tbody></table>";
					depth = 2;
					break;
				case "TR":
					div.innerHTML = "<table><tbody><tr>" + html.stripScripts() + "</tr></tbody></table>";
					depth = 3;
					break;
				case "TD":
					div.innerHTML = "<table><tbody><tr><td>" + html.stripScripts() + "</td></tr></tbody></table>";
					depth = 4
			}
			$A(element.childNodes).each(function (node) {
				element.removeChild(node)
			});
			depth.times(function () {
				div = div.firstChild
			});
			$A(div.childNodes).each(function (node) {
				element.appendChild(node)
			})
		} else {
			element.innerHTML = html.stripScripts()
		}
		setTimeout(function () {
			html.evalScripts()
		}, 10);
		return element
	}
}
Object.extend(Element, Element.Methods);
var _nativeExtensions = false;
if (/Konqueror|Safari|KHTML/.test(navigator.userAgent)) {
	["", "Form", "Input", "TextArea", "Select"].each(function (tag) {
		var className = "HTML" + tag + "Element";
		if (window[className]) {
			return
		}
		var klass = window[className] = {};
		klass.prototype = document.createElement(tag ? tag.toLowerCase() : "div").__proto__
	})
}
Element.addMethods = function (methods) {
	Object.extend(Element.Methods, methods || {});

	function copy(methods, destination, onlyIfAbsent) {
		onlyIfAbsent = onlyIfAbsent || false;
		var cache = Element.extend.cache;
		for (var property in methods) {
			var value = methods[property];
			if (!onlyIfAbsent || !(property in destination)) {
				destination[property] = cache.findOrStore(value)
			}
		}
	}
	if (typeof HTMLElement != "undefined") {
		copy(Element.Methods, HTMLElement.prototype);
		copy(Element.Methods.Simulated, HTMLElement.prototype, true);
		copy(Form.Methods, HTMLFormElement.prototype);
		[HTMLInputElement, HTMLTextAreaElement, HTMLSelectElement].each(function (klass) {
			copy(Form.Element.Methods, klass.prototype)
		});
		_nativeExtensions = true
	}
};
var Toggle = new Object();
Toggle.display = Element.toggle;
Abstract.Insertion = function (adjacency) {
	this.adjacency = adjacency
};
Abstract.Insertion.prototype = {
	initialize: function (element, content) {
		this.element = $(element);
		this.content = content.stripScripts();
		if (this.adjacency && this.element.insertAdjacentHTML) {
			try {
				this.element.insertAdjacentHTML(this.adjacency, this.content)
			} catch (e) {
				var tagName = this.element.tagName.toUpperCase();
				if (["TBODY", "TR"].include(tagName)) {
					this.insertContent(this.contentFromAnonymousTable())
				} else {
					throw e
				}
			}
		} else {
			this.range = this.element.ownerDocument.createRange();
			if (this.initializeRange) {
				this.initializeRange()
			}
			this.insertContent([this.range.createContextualFragment(this.content)])
		}
		setTimeout(function () {
			content.evalScripts()
		}, 10)
	},
	contentFromAnonymousTable: function () {
		var div = document.createElement("div");
		div.innerHTML = "<table><tbody>" + this.content + "</tbody></table>";
		return $A(div.childNodes[0].childNodes[0].childNodes)
	}
};
var Insertion = new Object();
Insertion.Before = Class.create();
Insertion.Before.prototype = Object.extend(new Abstract.Insertion("beforeBegin"), {
	initializeRange: function () {
		this.range.setStartBefore(this.element)
	},
	insertContent: function (fragments) {
		fragments.each((function (fragment) {
			this.element.parentNode.insertBefore(fragment, this.element)
		}).bind(this))
	}
});
Insertion.Top = Class.create();
Insertion.Top.prototype = Object.extend(new Abstract.Insertion("afterBegin"), {
	initializeRange: function () {
		this.range.selectNodeContents(this.element);
		this.range.collapse(true)
	},
	insertContent: function (fragments) {
		fragments.reverse(false).each((function (fragment) {
			this.element.insertBefore(fragment, this.element.firstChild)
		}).bind(this))
	}
});
Insertion.Bottom = Class.create();
Insertion.Bottom.prototype = Object.extend(new Abstract.Insertion("beforeEnd"), {
	initializeRange: function () {
		this.range.selectNodeContents(this.element);
		this.range.collapse(this.element)
	},
	insertContent: function (fragments) {
		fragments.each((function (fragment) {
			this.element.appendChild(fragment)
		}).bind(this))
	}
});
Insertion.After = Class.create();
Insertion.After.prototype = Object.extend(new Abstract.Insertion("afterEnd"), {
	initializeRange: function () {
		this.range.setStartAfter(this.element)
	},
	insertContent: function (fragments) {
		fragments.each((function (fragment) {
			this.element.parentNode.insertBefore(fragment, this.element.nextSibling)
		}).bind(this))
	}
});
Element.ClassNames = Class.create();
Element.ClassNames.prototype = {
	initialize: function (element) {
		this.element = $(element)
	},
	_each: function (iterator) {
		this.element.className.split(/\s+/).select(function (name) {
			return name.length > 0
		})._each(iterator)
	},
	set: function (className) {
		this.element.className = className
	},
	add: function (classNameToAdd) {
		if (this.include(classNameToAdd)) {
			return
		}
		this.set($A(this).concat(classNameToAdd).join(" "))
	},
	remove: function (classNameToRemove) {
		if (!this.include(classNameToRemove)) {
			return
		}
		this.set($A(this).without(classNameToRemove).join(" "))
	},
	toString: function () {
		return $A(this).join(" ")
	}
};
Object.extend(Element.ClassNames.prototype, Enumerable);
var Selector = Class.create();
Selector.prototype = {
	initialize: function (expression) {
		this.params = {
			classNames: []
		};
		this.expression = expression.toString().strip();
		this.parseExpression();
		this.compileMatcher()
	},
	parseExpression: function () {
		function abort(message) {
			throw "Parse error in selector: " + message
		}
		if (this.expression == "") {
			abort("empty expression")
		}
		var params = this.params,
			expr = this.expression,
			match, modifier, clause, rest;
		while (match = expr.match(/^(.*)\[([a-z0-9_:-]+?)(?:([~\|!]?=)(?:"([^"]*)"|([^\]\s]*)))?\]$/i)) {
			params.attributes = params.attributes || [];
			params.attributes.push({
				name: match[2],
				operator: match[3],
				value: match[4] || match[5] || ""
			});
			expr = match[1]
		}
		if (expr == "*") {
			return this.params.wildcard = true
		}
		while (match = expr.match(/^([^a-z0-9_-])?([a-z0-9_-]+)(.*)/i)) {
			modifier = match[1], clause = match[2], rest = match[3];
			switch (modifier) {
				case "#":
					params.id = clause;
					break;
				case ".":
					params.classNames.push(clause);
					break;
				case "":
				case undefined:
					params.tagName = clause.toUpperCase();
					break;
				default:
					abort(expr.inspect())
			}
			expr = rest
		}
		if (expr.length > 0) {
			abort(expr.inspect())
		}
	},
	buildMatchExpression: function () {
		var params = this.params,
			conditions = [],
			clause;
		if (params.wildcard) {
			conditions.push("true")
		}
		if (clause = params.id) {
			conditions.push('element.readAttribute("id") == ' + clause.inspect())
		}
		if (clause = params.tagName) {
			conditions.push("element.tagName.toUpperCase() == " + clause.inspect())
		}
		if ((clause = params.classNames).length > 0) {
			for (var i = 0, length = clause.length; i < length; i++) {
				conditions.push("element.hasClassName(" + clause[i].inspect() + ")")
			}
		}
		if (clause = params.attributes) {
			clause.each(function (attribute) {
				var value = "element.readAttribute(" + attribute.name.inspect() + ")";
				var splitValueBy = function (delimiter) {
					return value + " && " + value + ".split(" + delimiter.inspect() + ")"
				};
				switch (attribute.operator) {
					case "=":
						conditions.push(value + " == " + attribute.value.inspect());
						break;
					case "~=":
						conditions.push(splitValueBy(" ") + ".include(" + attribute.value.inspect() + ")");
						break;
					case "|=":
						conditions.push(splitValueBy("-") + ".first().toUpperCase() == " + attribute.value.toUpperCase().inspect());
						break;
					case "!=":
						conditions.push(value + " != " + attribute.value.inspect());
						break;
					case "":
					case undefined:
						conditions.push("element.hasAttribute(" + attribute.name.inspect() + ")");
						break;
					default:
						throw "Unknown operator " + attribute.operator + " in selector"
				}
			})
		}
		return conditions.join(" && ")
	},
	compileMatcher: function () {
		this.match = new Function("element", "if (!element.tagName) return false;       element = $(element);       return " + this.buildMatchExpression())
	},
	findElements: function (scope) {
		var element;
		if (element = $(this.params.id)) {
			if (this.match(element)) {
				if (!scope || Element.childOf(element, scope)) {
					return [element]
				}
			}
		}
		scope = (scope || document).getElementsByTagName(this.params.tagName || "*");
		var results = [];
		for (var i = 0, length = scope.length; i < length; i++) {
			if (this.match(element = scope[i])) {
				results.push(Element.extend(element))
			}
		}
		return results
	},
	toString: function () {
		return this.expression
	}
};
Object.extend(Selector, {
	matchElements: function (elements, expression) {
		var selector = new Selector(expression);
		return elements.select(selector.match.bind(selector)).map(Element.extend)
	},
	findElement: function (elements, expression, index) {
		if (typeof expression == "number") {
			index = expression, expression = false
		}
		return Selector.matchElements(elements, expression || "*")[index || 0]
	},
	findChildElements: function (element, expressions) {
		return expressions.map(function (expression) {
			return expression.match(/[^\s"]+(?:"[^"]*"[^\s"]+)*/g).inject([null], function (results, expr) {
				var selector = new Selector(expr);
				return results.inject([], function (elements, result) {
					return elements.concat(selector.findElements(result || element))
				})
			})
		}).flatten()
	}
});

function $$() {
	return Selector.findChildElements(document, $A(arguments))
}
var Form = {
	reset: function (form) {
		$(form).reset();
		return form
	},
	serializeElements: function (elements, getHash) {
		var data = elements.inject({}, function (result, element) {
			if (!element.disabled && element.name) {
				var key = element.name,
					value = $(element).getValue();
				if (value != undefined) {
					if (result[key]) {
						if (result[key].constructor != Array) {
							result[key] = [result[key]]
						}
						result[key].push(value)
					} else {
						result[key] = value
					}
				}
			}
			return result
		});
		return getHash ? data : Hash.toQueryString(data)
	}
};
Form.Methods = {
	serialize: function (form, getHash) {
		return Form.serializeElements(Form.getElements(form), getHash)
	},
	getElements: function (form) {
		return $A($(form).getElementsByTagName("*")).inject([], function (elements, child) {
			if (Form.Element.Serializers[child.tagName.toLowerCase()]) {
				elements.push(Element.extend(child))
			}
			return elements
		})
	},
	getInputs: function (form, typeName, name) {
		form = $(form);
		var inputs = form.getElementsByTagName("input");
		if (!typeName && !name) {
			return $A(inputs).map(Element.extend)
		}
		for (var i = 0, matchingInputs = [], length = inputs.length; i < length; i++) {
			var input = inputs[i];
			if ((typeName && input.type != typeName) || (name && input.name != name)) {
				continue
			}
			matchingInputs.push(Element.extend(input))
		}
		return matchingInputs
	},
	disable: function (form) {
		form = $(form);
		form.getElements().each(function (element) {
			element.blur();
			element.disabled = "true"
		});
		return form
	},
	enable: function (form) {
		form = $(form);
		form.getElements().each(function (element) {
			element.disabled = ""
		});
		return form
	},
	findFirstElement: function (form) {
		return $(form).getElements().find(function (element) {
			return element.type != "hidden" && !element.disabled && ["input", "select", "textarea"].include(element.tagName.toLowerCase())
		})
	},
	focusFirstElement: function (form) {
		form = $(form);
		form.findFirstElement().activate();
		return form
	}
};
Object.extend(Form, Form.Methods);
Form.Element = {
	focus: function (element) {
		$(element).focus();
		return element
	},
	select: function (element) {
		$(element).select();
		return element
	}
};
Form.Element.Methods = {
	serialize: function (element) {
		element = $(element);
		if (!element.disabled && element.name) {
			var value = element.getValue();
			if (value != undefined) {
				var pair = {};
				pair[element.name] = value;
				return Hash.toQueryString(pair)
			}
		}
		return ""
	},
	getValue: function (element) {
		element = $(element);
		var method = element.tagName.toLowerCase();
		return Form.Element.Serializers[method](element)
	},
	clear: function (element) {
		$(element).value = "";
		return element
	},
	present: function (element) {
		return $(element).value != ""
	},
	activate: function (element) {
		element = $(element);
		element.focus();
		if (element.select && (element.tagName.toLowerCase() != "input" || !["button", "reset", "submit"].include(element.type))) {
			element.select()
		}
		return element
	},
	disable: function (element) {
		element = $(element);
		element.disabled = true;
		return element
	},
	enable: function (element) {
		element = $(element);
		element.blur();
		element.disabled = false;
		return element
	}
};
Object.extend(Form.Element, Form.Element.Methods);
var Field = Form.Element;
var $F = Form.Element.getValue;
Form.Element.Serializers = {
	input: function (element) {
		switch (element.type.toLowerCase()) {
			case "checkbox":
			case "radio":
				return Form.Element.Serializers.inputSelector(element);
			default:
				return Form.Element.Serializers.textarea(element)
		}
	},
	inputSelector: function (element) {
		return element.checked ? element.value : null
	},
	textarea: function (element) {
		return element.value
	},
	select: function (element) {
		return this[element.type == "select-one" ? "selectOne" : "selectMany"](element)
	},
	selectOne: function (element) {
		var index = element.selectedIndex;
		return index >= 0 ? this.optionValue(element.options[index]) : null
	},
	selectMany: function (element) {
		var values, length = element.length;
		if (!length) {
			return null
		}
		for (var i = 0, values = []; i < length; i++) {
			var opt = element.options[i];
			if (opt.selected) {
				values.push(this.optionValue(opt))
			}
		}
		return values
	},
	optionValue: function (opt) {
		return Element.extend(opt).hasAttribute("value") ? opt.value : opt.text
	}
};
Abstract.TimedObserver = function () {};
Abstract.TimedObserver.prototype = {
	initialize: function (element, frequency, callback) {
		this.frequency = frequency;
		this.element = $(element);
		this.callback = callback;
		this.lastValue = this.getValue();
		this.registerCallback()
	},
	registerCallback: function () {
		setInterval(this.onTimerEvent.bind(this), this.frequency * 1000)
	},
	onTimerEvent: function () {
		var value = this.getValue();
		var changed = ("string" == typeof this.lastValue && "string" == typeof value ? this.lastValue != value : String(this.lastValue) != String(value));
		if (changed) {
			this.callback(this.element, value);
			this.lastValue = value
		}
	}
};
Form.Element.Observer = Class.create();
Form.Element.Observer.prototype = Object.extend(new Abstract.TimedObserver(), {
	getValue: function () {
		return Form.Element.getValue(this.element)
	}
});
Form.Observer = Class.create();
Form.Observer.prototype = Object.extend(new Abstract.TimedObserver(), {
	getValue: function () {
		return Form.serialize(this.element)
	}
});
Abstract.EventObserver = function () {};
Abstract.EventObserver.prototype = {
	initialize: function (element, callback) {
		this.element = $(element);
		this.callback = callback;
		this.lastValue = this.getValue();
		if (this.element.tagName.toLowerCase() == "form") {
			this.registerFormCallbacks()
		} else {
			this.registerCallback(this.element)
		}
	},
	onElementEvent: function () {
		var value = this.getValue();
		if (this.lastValue != value) {
			this.callback(this.element, value);
			this.lastValue = value
		}
	},
	registerFormCallbacks: function () {
		Form.getElements(this.element).each(this.registerCallback.bind(this))
	},
	registerCallback: function (element) {
		if (element.type) {
			switch (element.type.toLowerCase()) {
				case "checkbox":
				case "radio":
					Event.observe(element, "click", this.onElementEvent.bind(this));
					break;
				default:
					Event.observe(element, "change", this.onElementEvent.bind(this));
					break
			}
		}
	}
};
Form.Element.EventObserver = Class.create();
Form.Element.EventObserver.prototype = Object.extend(new Abstract.EventObserver(), {
	getValue: function () {
		return Form.Element.getValue(this.element)
	}
});
Form.EventObserver = Class.create();
Form.EventObserver.prototype = Object.extend(new Abstract.EventObserver(), {
	getValue: function () {
		return Form.serialize(this.element)
	}
});
if (!window.Event) {
	var Event = new Object()
}
Object.extend(Event, {
	KEY_BACKSPACE: 8,
	KEY_TAB: 9,
	KEY_RETURN: 13,
	KEY_ESC: 27,
	KEY_LEFT: 37,
	KEY_UP: 38,
	KEY_RIGHT: 39,
	KEY_DOWN: 40,
	KEY_DELETE: 46,
	KEY_HOME: 36,
	KEY_END: 35,
	KEY_PAGEUP: 33,
	KEY_PAGEDOWN: 34,
	element: function (event) {
		return event.target || event.srcElement
	},
	isLeftClick: function (event) {
		return (((event.which) && (event.which == 1)) || ((event.button) && (event.button == 1)))
	},
	pointerX: function (event) {
		return event.pageX || (event.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft))
	},
	pointerY: function (event) {
		return event.pageY || (event.clientY + (document.documentElement.scrollTop || document.body.scrollTop))
	},
	stop: function (event) {
		if (event.preventDefault) {
			event.preventDefault();
			event.stopPropagation()
		} else {
			event.returnValue = false;
			event.cancelBubble = true
		}
	},
	findElement: function (event, tagName) {
		var element = Event.element(event);
		while (element.parentNode && (!element.tagName || (element.tagName.toUpperCase() != tagName.toUpperCase()))) {
			element = element.parentNode
		}
		return element
	},
	observers: false,
	_observeAndCache: function (element, name, observer, useCapture) {
		if (!this.observers) {
			this.observers = []
		}
		if (element.addEventListener) {
			this.observers.push([element, name, observer, useCapture]);
			element.addEventListener(name, observer, useCapture)
		} else {
			if (element.attachEvent) {
				this.observers.push([element, name, observer, useCapture]);
				element.attachEvent("on" + name, observer)
			}
		}
	},
	unloadCache: function () {
		if (!Event.observers) {
			return
		}
		for (var i = 0, length = Event.observers.length; i < length; i++) {
			Event.stopObserving.apply(this, Event.observers[i]);
			Event.observers[i][0] = null
		}
		Event.observers = false
	},
	observe: function (element, name, observer, useCapture) {
		element = $(element);
		useCapture = useCapture || false;
		if (name == "keypress" && (navigator.appVersion.match(/Konqueror|Safari|KHTML/) || element.attachEvent)) {
			name = "keydown"
		}
		Event._observeAndCache(element, name, observer, useCapture)
	},
	stopObserving: function (element, name, observer, useCapture) {
		element = $(element);
		useCapture = useCapture || false;
		if (name == "keypress" && (navigator.appVersion.match(/Konqueror|Safari|KHTML/) || element.detachEvent)) {
			name = "keydown"
		}
		if (element.removeEventListener) {
			element.removeEventListener(name, observer, useCapture)
		} else {
			if (element.detachEvent) {
				try {
					element.detachEvent("on" + name, observer)
				} catch (e) {}
			}
		}
	}
});
if (navigator.appVersion.match(/\bMSIE\b/)) {
	Event.observe(window, "unload", Event.unloadCache, false)
}
var Position = {
	includeScrollOffsets: false,
	prepare: function () {
		this.deltaX = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
		this.deltaY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
	},
	realOffset: function (element) {
		var valueT = 0,
			valueL = 0;
		do {
			valueT += element.scrollTop || 0;
			valueL += element.scrollLeft || 0;
			element = element.parentNode
		} while (element);
		return [valueL, valueT]
	},
	cumulativeOffset: function (element) {
		var valueT = 0,
			valueL = 0;
		do {
			valueT += element.offsetTop || 0;
			valueL += element.offsetLeft || 0;
			element = element.offsetParent
		} while (element);
		return [valueL, valueT]
	},
	positionedOffset: function (element) {
		var valueT = 0,
			valueL = 0;
		do {
			valueT += element.offsetTop || 0;
			valueL += element.offsetLeft || 0;
			element = element.offsetParent;
			if (element) {
				if (element.tagName == "BODY") {
					break
				}
				var p = Element.getStyle(element, "position");
				if (p == "relative" || p == "absolute") {
					break
				}
			}
		} while (element);
		return [valueL, valueT]
	},
	offsetParent: function (element) {
		if (element.offsetParent) {
			return element.offsetParent
		}
		if (element == document.body) {
			return element
		}
		while ((element = element.parentNode) && element != document.body) {
			if (Element.getStyle(element, "position") != "static") {
				return element
			}
		}
		return document.body
	},
	within: function (element, x, y) {
		if (this.includeScrollOffsets) {
			return this.withinIncludingScrolloffsets(element, x, y)
		}
		this.xcomp = x;
		this.ycomp = y;
		this.offset = this.cumulativeOffset(element);
		return (y >= this.offset[1] && y < this.offset[1] + element.offsetHeight && x >= this.offset[0] && x < this.offset[0] + element.offsetWidth)
	},
	withinIncludingScrolloffsets: function (element, x, y) {
		var offsetcache = this.realOffset(element);
		this.xcomp = x + offsetcache[0] - this.deltaX;
		this.ycomp = y + offsetcache[1] - this.deltaY;
		this.offset = this.cumulativeOffset(element);
		return (this.ycomp >= this.offset[1] && this.ycomp < this.offset[1] + element.offsetHeight && this.xcomp >= this.offset[0] && this.xcomp < this.offset[0] + element.offsetWidth)
	},
	overlap: function (mode, element) {
		if (!mode) {
			return 0
		}
		if (mode == "vertical") {
			return ((this.offset[1] + element.offsetHeight) - this.ycomp) / element.offsetHeight
		}
		if (mode == "horizontal") {
			return ((this.offset[0] + element.offsetWidth) - this.xcomp) / element.offsetWidth
		}
	},
	page: function (forElement) {
		var valueT = 0,
			valueL = 0;
		var element = forElement;
		do {
			valueT += element.offsetTop || 0;
			valueL += element.offsetLeft || 0;
			if (element.offsetParent == document.body) {
				if (Element.getStyle(element, "position") == "absolute") {
					break
				}
			}
		} while (element = element.offsetParent);
		element = forElement;
		do {
			if (!window.opera || element.tagName == "BODY") {
				valueT -= element.scrollTop || 0;
				valueL -= element.scrollLeft || 0
			}
		} while (element = element.parentNode);
		return [valueL, valueT]
	},
	clone: function (source, target) {
		var options = Object.extend({
			setLeft: true,
			setTop: true,
			setWidth: true,
			setHeight: true,
			offsetTop: 0,
			offsetLeft: 0
		}, arguments[2] || {});
		source = $(source);
		var p = Position.page(source);
		target = $(target);
		var delta = [0, 0];
		var parent = null;
		if (Element.getStyle(target, "position") == "absolute") {
			parent = Position.offsetParent(target);
			delta = Position.page(parent)
		}
		if (parent == document.body) {
			delta[0] -= document.body.offsetLeft;
			delta[1] -= document.body.offsetTop
		}
		if (options.setLeft) {
			target.style.left = (p[0] - delta[0] + options.offsetLeft) + "px"
		}
		if (options.setTop) {
			target.style.top = (p[1] - delta[1] + options.offsetTop) + "px"
		}
		if (options.setWidth) {
			target.style.width = source.offsetWidth + "px"
		}
		if (options.setHeight) {
			target.style.height = source.offsetHeight + "px"
		}
	},
	absolutize: function (element) {
		element = $(element);
		if (element.style.position == "absolute") {
			return
		}
		Position.prepare();
		var offsets = Position.positionedOffset(element);
		var top = offsets[1];
		var left = offsets[0];
		var width = element.clientWidth;
		var height = element.clientHeight;
		element._originalLeft = left - parseFloat(element.style.left || 0);
		element._originalTop = top - parseFloat(element.style.top || 0);
		element._originalWidth = element.style.width;
		element._originalHeight = element.style.height;
		element.style.position = "absolute";
		element.style.top = top + "px";
		element.style.left = left + "px";
		element.style.width = width + "px";
		element.style.height = height + "px"
	},
	relativize: function (element) {
		element = $(element);
		if (element.style.position == "relative") {
			return
		}
		Position.prepare();
		element.style.position = "relative";
		var top = parseFloat(element.style.top || 0) - (element._originalTop || 0);
		var left = parseFloat(element.style.left || 0) - (element._originalLeft || 0);
		element.style.top = top + "px";
		element.style.left = left + "px";
		element.style.height = element._originalHeight;
		element.style.width = element._originalWidth
	}
};
if (/Konqueror|Safari|KHTML/.test(navigator.userAgent)) {
	Position.cumulativeOffset = function (element) {
		var valueT = 0,
			valueL = 0;
		do {
			valueT += element.offsetTop || 0;
			valueL += element.offsetLeft || 0;
			if (element.offsetParent == document.body) {
				if (Element.getStyle(element, "position") == "absolute") {
					break
				}
			}
			element = element.offsetParent
		} while (element);
		return [valueL, valueT]
	}
}
Element.addMethods();
Array.prototype.reduce = function (callback) {
	if (this == null) {
		throw new TypeError("Array.prototype.reduce called on null or undefined")
	}
	if (typeof callback !== "function") {
		throw new TypeError(callback + " is not a function")
	}
	var t = Object(this),
		len = t.length >>> 0,
		k = 0,
		value;
	if (arguments.length == 2) {
		value = arguments[1]
	} else {
		while (k < len && !k in t) {
			k++
		}
		if (k >= len) {
			throw new TypeError("Reduce of empty array with no initial value")
		}
		value = t[k++]
	}
	for (; k < len; k++) {
		if (k in t) {
			value = callback(value, t[k], k, t)
		}
	}
	return value
};
(function (a, b) {
	function cy(a) {
		return f.isWindow(a) ? a : a.nodeType === 9 ? a.defaultView || a.parentWindow : !1
	}

	function cu(a) {
		if (!cj[a]) {
			var b = c.body,
				d = f("<" + a + ">").appendTo(b),
				e = d.css("display");
			d.remove();
			if (e === "none" || e === "") {
				ck || (ck = c.createElement("iframe"), ck.frameBorder = ck.width = ck.height = 0), b.appendChild(ck);
				if (!cl || !ck.createElement) {
					cl = (ck.contentWindow || ck.contentDocument).document, cl.write((f.support.boxModel ? "<!doctype html>" : "") + "<html><body>"), cl.close()
				}
				d = cl.createElement(a), cl.body.appendChild(d), e = f.css(d, "display"), b.removeChild(ck)
			}
			cj[a] = e
		}
		return cj[a]
	}

	function ct(a, b) {
		var c = {};
		f.each(cp.concat.apply([], cp.slice(0, b)), function () {
			c[this] = a
		});
		return c
	}

	function cs() {
		cq = b
	}

	function cr() {
		setTimeout(cs, 0);
		return cq = f.now()
	}

	function ci() {
		try {
			return new a.ActiveXObject("Microsoft.XMLHTTP")
		} catch (b) {}
	}

	function ch() {
		try {
			return new a.XMLHttpRequest
		} catch (b) {}
	}

	function cb(a, c) {
		a.dataFilter && (c = a.dataFilter(c, a.dataType));
		var d = a.dataTypes,
			e = {},
			g, h, i = d.length,
			j, k = d[0],
			l, m, n, o, p;
		for (g = 1; g < i; g++) {
			if (g === 1) {
				for (h in a.converters) {
					typeof h == "string" && (e[h.toLowerCase()] = a.converters[h])
				}
			}
			l = k, k = d[g];
			if (k === "*") {
				k = l
			} else {
				if (l !== "*" && l !== k) {
					m = l + " " + k, n = e[m] || e["* " + k];
					if (!n) {
						p = b;
						for (o in e) {
							j = o.split(" ");
							if (j[0] === l || j[0] === "*") {
								p = e[j[1] + " " + k];
								if (p) {
									o = e[o], o === !0 ? n = p : p === !0 && (n = o);
									break
								}
							}
						}
					}!n && !p && f.error("No conversion from " + m.replace(" ", " to ")), n !== !0 && (c = n ? n(c) : p(o(c)))
				}
			}
		}
		return c
	}

	function ca(a, c, d) {
		var e = a.contents,
			f = a.dataTypes,
			g = a.responseFields,
			h, i, j, k;
		for (i in g) {
			i in d && (c[g[i]] = d[i])
		}
		while (f[0] === "*") {
			f.shift(), h === b && (h = a.mimeType || c.getResponseHeader("content-type"))
		}
		if (h) {
			for (i in e) {
				if (e[i] && e[i].test(h)) {
					f.unshift(i);
					break
				}
			}
		}
		if (f[0] in d) {
			j = f[0]
		} else {
			for (i in d) {
				if (!f[0] || a.converters[i + " " + f[0]]) {
					j = i;
					break
				}
				k || (k = i)
			}
			j = j || k
		}
		if (j) {
			j !== f[0] && f.unshift(j);
			return d[j]
		}
	}

	function b_(a, b, c, d) {
		if (f.isArray(b)) {
			f.each(b, function (b, e) {
				c || bD.test(a) ? d(a, e) : b_(a + "[" + (typeof e == "object" ? b : "") + "]", e, c, d)
			})
		} else {
			if (!c && f.type(b) === "object") {
				for (var e in b) {
					b_(a + "[" + e + "]", b[e], c, d)
				}
			} else {
				d(a, b)
			}
		}
	}

	function b$(a, c) {
		var d, e, g = f.ajaxSettings.flatOptions || {};
		for (d in c) {
			c[d] !== b && ((g[d] ? a : e || (e = {}))[d] = c[d])
		}
		e && f.extend(!0, a, e)
	}

	function bZ(a, c, d, e, f, g) {
		f = f || c.dataTypes[0], g = g || {}, g[f] = !0;
		var h = a[f],
			i = 0,
			j = h ? h.length : 0,
			k = a === bS,
			l;
		for (; i < j && (k || !l); i++) {
			l = h[i](c, d, e), typeof l == "string" && (!k || g[l] ? l = b : (c.dataTypes.unshift(l), l = bZ(a, c, d, e, l, g)))
		}(k || !l) && !g["*"] && (l = bZ(a, c, d, e, "*", g));
		return l
	}

	function bY(a) {
		return function (b, c) {
			typeof b != "string" && (c = b, b = "*");
			if (f.isFunction(c)) {
				var d = b.toLowerCase().split(bO),
					e = 0,
					g = d.length,
					h, i, j;
				for (; e < g; e++) {
					h = d[e], j = /^\+/.test(h), j && (h = h.substr(1) || "*"), i = a[h] = a[h] || [], i[j ? "unshift" : "push"](c)
				}
			}
		}
	}

	function bB(a, b, c) {
		var d = b === "width" ? a.offsetWidth : a.offsetHeight,
			e = b === "width" ? 1 : 0,
			g = 4;
		if (d > 0) {
			if (c !== "border") {
				for (; e < g; e += 2) {
					c || (d -= parseFloat(f.css(a, "padding" + bx[e])) || 0), c === "margin" ? d += parseFloat(f.css(a, c + bx[e])) || 0 : d -= parseFloat(f.css(a, "border" + bx[e] + "Width")) || 0
				}
			}
			return d + "px"
		}
		d = by(a, b);
		if (d < 0 || d == null) {
			d = a.style[b]
		}
		if (bt.test(d)) {
			return d
		}
		d = parseFloat(d) || 0;
		if (c) {
			for (; e < g; e += 2) {
				d += parseFloat(f.css(a, "padding" + bx[e])) || 0, c !== "padding" && (d += parseFloat(f.css(a, "border" + bx[e] + "Width")) || 0), c === "margin" && (d += parseFloat(f.css(a, c + bx[e])) || 0)
			}
		}
		return d + "px"
	}

	function bo(a) {
		var b = c.createElement("div");
		bh.appendChild(b), b.innerHTML = a.outerHTML;
		return b.firstChild
	}

	function bn(a) {
		var b = (a.nodeName || "").toLowerCase();
		b === "input" ? bm(a) : b !== "script" && typeof a.getElementsByTagName != "undefined" && f.grep(a.getElementsByTagName("input"), bm)
	}

	function bm(a) {
		if (a.type === "checkbox" || a.type === "radio") {
			a.defaultChecked = a.checked
		}
	}

	function bl(a) {
		return typeof a.getElementsByTagName != "undefined" ? a.getElementsByTagName("*") : typeof a.querySelectorAll != "undefined" ? a.querySelectorAll("*") : []
	}

	function bk(a, b) {
		var c;
		b.nodeType === 1 && (b.clearAttributes && b.clearAttributes(), b.mergeAttributes && b.mergeAttributes(a), c = b.nodeName.toLowerCase(), c === "object" ? b.outerHTML = a.outerHTML : c !== "input" || a.type !== "checkbox" && a.type !== "radio" ? c === "option" ? b.selected = a.defaultSelected : c === "input" || c === "textarea" ? b.defaultValue = a.defaultValue : c === "script" && b.text !== a.text && (b.text = a.text) : (a.checked && (b.defaultChecked = b.checked = a.checked), b.value !== a.value && (b.value = a.value)), b.removeAttribute(f.expando), b.removeAttribute("_submit_attached"), b.removeAttribute("_change_attached"))
	}

	function bj(a, b) {
		if (b.nodeType === 1 && !!f.hasData(a)) {
			var c, d, e, g = f._data(a),
				h = f._data(b, g),
				i = g.events;
			if (i) {
				delete h.handle, h.events = {};
				for (c in i) {
					for (d = 0, e = i[c].length; d < e; d++) {
						f.event.add(b, c, i[c][d])
					}
				}
			}
			h.data && (h.data = f.extend({}, h.data))
		}
	}

	function bi(a, b) {
		return f.nodeName(a, "table") ? a.getElementsByTagName("tbody")[0] || a.appendChild(a.ownerDocument.createElement("tbody")) : a
	}

	function U(a) {
		var b = V.split("|"),
			c = a.createDocumentFragment();
		if (c.createElement) {
			while (b.length) {
				c.createElement(b.pop())
			}
		}
		return c
	}

	function T(a, b, c) {
		b = b || 0;
		if (f.isFunction(b)) {
			return f.grep(a, function (a, d) {
				var e = !!b.call(a, d, a);
				return e === c
			})
		}
		if (b.nodeType) {
			return f.grep(a, function (a, d) {
				return a === b === c
			})
		}
		if (typeof b == "string") {
			var d = f.grep(a, function (a) {
				return a.nodeType === 1
			});
			if (O.test(b)) {
				return f.filter(b, d, !c)
			}
			b = f.filter(b, d)
		}
		return f.grep(a, function (a, d) {
			return f.inArray(a, b) >= 0 === c
		})
	}

	function S(a) {
		return !a || !a.parentNode || a.parentNode.nodeType === 11
	}

	function K() {
		return !0
	}

	function J() {
		return !1
	}

	function n(a, b, c) {
		var d = b + "defer",
			e = b + "queue",
			g = b + "mark",
			h = f._data(a, d);
		h && (c === "queue" || !f._data(a, e)) && (c === "mark" || !f._data(a, g)) && setTimeout(function () {
			!f._data(a, e) && !f._data(a, g) && (f.removeData(a, d, !0), h.fire())
		}, 0)
	}

	function m(a) {
		for (var b in a) {
			if (b === "data" && f.isEmptyObject(a[b])) {
				continue
			}
			if (b !== "toJSON") {
				return !1
			}
		}
		return !0
	}

	function l(a, c, d) {
		if (d === b && a.nodeType === 1) {
			var e = "data-" + c.replace(k, "-$1").toLowerCase();
			d = a.getAttribute(e);
			if (typeof d == "string") {
				try {
					d = d === "true" ? !0 : d === "false" ? !1 : d === "null" ? null : f.isNumeric(d) ? +d : j.test(d) ? f.parseJSON(d) : d
				} catch (g) {}
				f.data(a, c, d)
			} else {
				d = b
			}
		}
		return d
	}

	function h(a) {
		var b = g[a] = {},
			c, d;
		a = a.split(/\s+/);
		for (c = 0, d = a.length; c < d; c++) {
			b[a[c]] = !0
		}
		return b
	}
	var c = a.document,
		d = a.navigator,
		e = a.location,
		f = function () {
			function J() {
				if (!e.isReady) {
					try {
						c.documentElement.doScroll("left")
					} catch (a) {
						setTimeout(J, 1);
						return
					}
					e.ready()
				}
			}
			var e = function (a, b) {
					return new e.fn.init(a, b, h)
				},
				f = a.jQuery,
				g = a.$,
				h, i = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,
				j = /\S/,
				k = /^\s+/,
				l = /\s+$/,
				m = /^<(\w+)\s*\/?>(?:<\/\1>)?$/,
				n = /^[\],:{}\s]*$/,
				o = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
				p = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
				q = /(?:^|:|,)(?:\s*\[)+/g,
				r = /(webkit)[ \/]([\w.]+)/,
				s = /(opera)(?:.*version)?[ \/]([\w.]+)/,
				t = /(msie) ([\w.]+)/,
				u = /(mozilla)(?:.*? rv:([\w.]+))?/,
				v = /-([a-z]|[0-9])/ig,
				w = /^-ms-/,
				x = function (a, b) {
					return (b + "").toUpperCase()
				},
				y = d.userAgent,
				z, A, B, C = Object.prototype.toString,
				D = Object.prototype.hasOwnProperty,
				E = Array.prototype.push,
				F = Array.prototype.slice,
				G = String.prototype.trim,
				H = Array.prototype.indexOf,
				I = {};
			e.fn = e.prototype = {
				constructor: e,
				init: function (a, d, f) {
					var g, h, j, k;
					if (!a) {
						return this
					}
					if (a.nodeType) {
						this.context = this[0] = a, this.length = 1;
						return this
					}
					if (a === "body" && !d && c.body) {
						this.context = c, this[0] = c.body, this.selector = a, this.length = 1;
						return this
					}
					if (typeof a == "string") {
						a.charAt(0) !== "<" || a.charAt(a.length - 1) !== ">" || a.length < 3 ? g = i.exec(a) : g = [null, a, null];
						if (g && (g[1] || !d)) {
							if (g[1]) {
								d = d instanceof e ? d[0] : d, k = d ? d.ownerDocument || d : c, j = m.exec(a), j ? e.isPlainObject(d) ? (a = [c.createElement(j[1])], e.fn.attr.call(a, d, !0)) : a = [k.createElement(j[1])] : (j = e.buildFragment([g[1]], [k]), a = (j.cacheable ? e.clone(j.fragment) : j.fragment).childNodes);
								return e.merge(this, a)
							}
							h = c.getElementById(g[2]);
							if (h && h.parentNode) {
								if (h.id !== g[2]) {
									return f.find(a)
								}
								this.length = 1, this[0] = h
							}
							this.context = c, this.selector = a;
							return this
						}
						return !d || d.jquery ? (d || f).find(a) : this.constructor(d).find(a)
					}
					if (e.isFunction(a)) {
						return f.ready(a)
					}
					a.selector !== b && (this.selector = a.selector, this.context = a.context);
					return e.makeArray(a, this)
				},
				selector: "",
				jquery: "1.7.2",
				length: 0,
				size: function () {
					return this.length
				},
				toArray: function () {
					return F.call(this, 0)
				},
				get: function (a) {
					return a == null ? this.toArray() : a < 0 ? this[this.length + a] : this[a]
				},
				pushStack: function (a, b, c) {
					var d = this.constructor();
					e.isArray(a) ? E.apply(d, a) : e.merge(d, a), d.prevObject = this, d.context = this.context, b === "find" ? d.selector = this.selector + (this.selector ? " " : "") + c : b && (d.selector = this.selector + "." + b + "(" + c + ")");
					return d
				},
				each: function (a, b) {
					return e.each(this, a, b)
				},
				ready: function (a) {
					e.bindReady(), A.add(a);
					return this
				},
				eq: function (a) {
					a = +a;
					return a === -1 ? this.slice(a) : this.slice(a, a + 1)
				},
				first: function () {
					return this.eq(0)
				},
				last: function () {
					return this.eq(-1)
				},
				slice: function () {
					return this.pushStack(F.apply(this, arguments), "slice", F.call(arguments).join(","))
				},
				map: function (a) {
					return this.pushStack(e.map(this, function (b, c) {
						return a.call(b, c, b)
					}))
				},
				end: function () {
					return this.prevObject || this.constructor(null)
				},
				push: E,
				sort: [].sort,
				splice: [].splice
			}, e.fn.init.prototype = e.fn, e.extend = e.fn.extend = function () {
				var a, c, d, f, g, h, i = arguments[0] || {},
					j = 1,
					k = arguments.length,
					l = !1;
				typeof i == "boolean" && (l = i, i = arguments[1] || {}, j = 2), typeof i != "object" && !e.isFunction(i) && (i = {}), k === j && (i = this, --j);
				for (; j < k; j++) {
					if ((a = arguments[j]) != null) {
						for (c in a) {
							d = i[c], f = a[c];
							if (i === f) {
								continue
							}
							l && f && (e.isPlainObject(f) || (g = e.isArray(f))) ? (g ? (g = !1, h = d && e.isArray(d) ? d : []) : h = d && e.isPlainObject(d) ? d : {}, i[c] = e.extend(l, h, f)) : f !== b && (i[c] = f)
						}
					}
				}
				return i
			}, e.extend({
				noConflict: function (b) {
					a.$ === e && (a.$ = g), b && a.jQuery === e && (a.jQuery = f);
					return e
				},
				isReady: !1,
				readyWait: 1,
				holdReady: function (a) {
					a ? e.readyWait++ : e.ready(!0)
				},
				ready: function (a) {
					if (a === !0 && !--e.readyWait || a !== !0 && !e.isReady) {
						if (!c.body) {
							return setTimeout(e.ready, 1)
						}
						e.isReady = !0;
						if (a !== !0 && --e.readyWait > 0) {
							return
						}
						A.fireWith(c, [e]), e.fn.trigger && e(c).trigger("ready").off("ready")
					}
				},
				bindReady: function () {
					if (!A) {
						A = e.Callbacks("once memory");
						if (c.readyState === "complete") {
							return setTimeout(e.ready, 1)
						}
						if (c.addEventListener) {
							c.addEventListener("DOMContentLoaded", B, !1), a.addEventListener("load", e.ready, !1)
						} else {
							if (c.attachEvent) {
								c.attachEvent("onreadystatechange", B), a.attachEvent("onload", e.ready);
								var b = !1;
								try {
									b = a.frameElement == null
								} catch (d) {}
								c.documentElement.doScroll && b && J()
							}
						}
					}
				},
				isFunction: function (a) {
					return e.type(a) === "function"
				},
				isArray: Array.isArray || function (a) {
					return e.type(a) === "array"
				},
				isWindow: function (a) {
					return a != null && a == a.window
				},
				isNumeric: function (a) {
					return !isNaN(parseFloat(a)) && isFinite(a)
				},
				type: function (a) {
					return a == null ? String(a) : I[C.call(a)] || "object"
				},
				isPlainObject: function (a) {
					if (!a || e.type(a) !== "object" || a.nodeType || e.isWindow(a)) {
						return !1
					}
					try {
						if (a.constructor && !D.call(a, "constructor") && !D.call(a.constructor.prototype, "isPrototypeOf")) {
							return !1
						}
					} catch (c) {
						return !1
					}
					var d;
					for (d in a) {}
					return d === b || D.call(a, d)
				},
				isEmptyObject: function (a) {
					for (var b in a) {
						return !1
					}
					return !0
				},
				error: function (a) {
					throw new Error(a)
				},
				parseJSON: function (b) {
					if (typeof b != "string" || !b) {
						return null
					}
					b = e.trim(b);
					if (a.JSON && a.JSON.parse) {
						return a.JSON.parse(b)
					}
					if (n.test(b.replace(o, "@").replace(p, "]").replace(q, ""))) {
						return (new Function("return " + b))()
					}
					e.error("Invalid JSON: " + b)
				},
				parseXML: function (c) {
					if (typeof c != "string" || !c) {
						return null
					}
					var d, f;
					try {
						a.DOMParser ? (f = new DOMParser, d = f.parseFromString(c, "text/xml")) : (d = new ActiveXObject("Microsoft.XMLDOM"), d.async = "false", d.loadXML(c))
					} catch (g) {
						d = b
					}(!d || !d.documentElement || d.getElementsByTagName("parsererror").length) && e.error("Invalid XML: " + c);
					return d
				},
				noop: function () {},
				globalEval: function (b) {
					b && j.test(b) && (a.execScript || function (b) {
						a.eval.call(a, b)
					})(b)
				},
				camelCase: function (a) {
					return a.replace(w, "ms-").replace(v, x)
				},
				nodeName: function (a, b) {
					return a.nodeName && a.nodeName.toUpperCase() === b.toUpperCase()
				},
				each: function (a, c, d) {
					var f, g = 0,
						h = a.length,
						i = h === b || e.isFunction(a);
					if (d) {
						if (i) {
							for (f in a) {
								if (c.apply(a[f], d) === !1) {
									break
								}
							}
						} else {
							for (; g < h;) {
								if (c.apply(a[g++], d) === !1) {
									break
								}
							}
						}
					} else {
						if (i) {
							for (f in a) {
								if (c.call(a[f], f, a[f]) === !1) {
									break
								}
							}
						} else {
							for (; g < h;) {
								if (c.call(a[g], g, a[g++]) === !1) {
									break
								}
							}
						}
					}
					return a
				},
				trim: G ? function (a) {
					return a == null ? "" : G.call(a)
				} : function (a) {
					return a == null ? "" : (a + "").replace(k, "").replace(l, "")
				},
				makeArray: function (a, b) {
					var c = b || [];
					if (a != null) {
						var d = e.type(a);
						a.length == null || d === "string" || d === "function" || d === "regexp" || e.isWindow(a) ? E.call(c, a) : e.merge(c, a)
					}
					return c
				},
				inArray: function (a, b, c) {
					var d;
					if (b) {
						if (H) {
							return H.call(b, a, c)
						}
						d = b.length, c = c ? c < 0 ? Math.max(0, d + c) : c : 0;
						for (; c < d; c++) {
							if (c in b && b[c] === a) {
								return c
							}
						}
					}
					return -1
				},
				merge: function (a, c) {
					var d = a.length,
						e = 0;
					if (typeof c.length == "number") {
						for (var f = c.length; e < f; e++) {
							a[d++] = c[e]
						}
					} else {
						while (c[e] !== b) {
							a[d++] = c[e++]
						}
					}
					a.length = d;
					return a
				},
				grep: function (a, b, c) {
					var d = [],
						e;
					c = !!c;
					for (var f = 0, g = a.length; f < g; f++) {
						e = !!b(a[f], f), c !== e && d.push(a[f])
					}
					return d
				},
				map: function (a, c, d) {
					var f, g, h = [],
						i = 0,
						j = a.length,
						k = a instanceof e || j !== b && typeof j == "number" && (j > 0 && a[0] && a[j - 1] || j === 0 || e.isArray(a));
					if (k) {
						for (; i < j; i++) {
							f = c(a[i], i, d), f != null && (h[h.length] = f)
						}
					} else {
						for (g in a) {
							f = c(a[g], g, d), f != null && (h[h.length] = f)
						}
					}
					return h.concat.apply([], h)
				},
				guid: 1,
				proxy: function (a, c) {
					if (typeof c == "string") {
						var d = a[c];
						c = a, a = d
					}
					if (!e.isFunction(a)) {
						return b
					}
					var f = F.call(arguments, 2),
						g = function () {
							return a.apply(c, f.concat(F.call(arguments)))
						};
					g.guid = a.guid = a.guid || g.guid || e.guid++;
					return g
				},
				access: function (a, c, d, f, g, h, i) {
					var j, k = d == null,
						l = 0,
						m = a.length;
					if (d && typeof d == "object") {
						for (l in d) {
							e.access(a, c, l, d[l], 1, h, f)
						}
						g = 1
					} else {
						if (f !== b) {
							j = i === b && e.isFunction(f), k && (j ? (j = c, c = function (a, b, c) {
								return j.call(e(a), c)
							}) : (c.call(a, f), c = null));
							if (c) {
								for (; l < m; l++) {
									c(a[l], d, j ? f.call(a[l], l, c(a[l], d)) : f, i)
								}
							}
							g = 1
						}
					}
					return g ? a : k ? c.call(a) : m ? c(a[0], d) : h
				},
				now: function () {
					return (new Date).getTime()
				},
				uaMatch: function (a) {
					a = a.toLowerCase();
					var b = r.exec(a) || s.exec(a) || t.exec(a) || a.indexOf("compatible") < 0 && u.exec(a) || [];
					return {
						browser: b[1] || "",
						version: b[2] || "0"
					}
				},
				sub: function () {
					function a(b, c) {
						return new a.fn.init(b, c)
					}
					e.extend(!0, a, this), a.superclass = this, a.fn = a.prototype = this(), a.fn.constructor = a, a.sub = this.sub, a.fn.init = function (d, f) {
						f && f instanceof e && !(f instanceof a) && (f = a(f));
						return e.fn.init.call(this, d, f, b)
					}, a.fn.init.prototype = a.fn;
					var b = a(c);
					return a
				},
				browser: {}
			}), e.each("Boolean Number String Function Array Date RegExp Object".split(" "), function (a, b) {
				I["[object " + b + "]"] = b.toLowerCase()
			}), z = e.uaMatch(y), z.browser && (e.browser[z.browser] = !0, e.browser.version = z.version), e.browser.webkit && (e.browser.safari = !0), j.test("Ã‚ ") && (k = /^[\s\xA0]+/, l = /[\s\xA0]+$/), h = e(c), c.addEventListener ? B = function () {
				c.removeEventListener("DOMContentLoaded", B, !1), e.ready()
			} : c.attachEvent && (B = function () {
				c.readyState === "complete" && (c.detachEvent("onreadystatechange", B), e.ready())
			});
			return e
		}(),
		g = {};
	f.Callbacks = function (a) {
		a = a ? g[a] || h(a) : {};
		var c = [],
			d = [],
			e, i, j, k, l, m, n = function (b) {
				var d, e, g, h, i;
				for (d = 0, e = b.length; d < e; d++) {
					g = b[d], h = f.type(g), h === "array" ? n(g) : h === "function" && (!a.unique || !p.has(g)) && c.push(g)
				}
			},
			o = function (b, f) {
				f = f || [], e = !a.memory || [b, f], i = !0, j = !0, m = k || 0, k = 0, l = c.length;
				for (; c && m < l; m++) {
					if (c[m].apply(b, f) === !1 && a.stopOnFalse) {
						e = !0;
						break
					}
				}
				j = !1, c && (a.once ? e === !0 ? p.disable() : c = [] : d && d.length && (e = d.shift(), p.fireWith(e[0], e[1])))
			},
			p = {
				add: function () {
					if (c) {
						var a = c.length;
						n(arguments), j ? l = c.length : e && e !== !0 && (k = a, o(e[0], e[1]))
					}
					return this
				},
				remove: function () {
					if (c) {
						var b = arguments,
							d = 0,
							e = b.length;
						for (; d < e; d++) {
							for (var f = 0; f < c.length; f++) {
								if (b[d] === c[f]) {
									j && f <= l && (l--, f <= m && m--), c.splice(f--, 1);
									if (a.unique) {
										break
									}
								}
							}
						}
					}
					return this
				},
				has: function (a) {
					if (c) {
						var b = 0,
							d = c.length;
						for (; b < d; b++) {
							if (a === c[b]) {
								return !0
							}
						}
					}
					return !1
				},
				empty: function () {
					c = [];
					return this
				},
				disable: function () {
					c = d = e = b;
					return this
				},
				disabled: function () {
					return !c
				},
				lock: function () {
					d = b, (!e || e === !0) && p.disable();
					return this
				},
				locked: function () {
					return !d
				},
				fireWith: function (b, c) {
					d && (j ? a.once || d.push([b, c]) : (!a.once || !e) && o(b, c));
					return this
				},
				fire: function () {
					p.fireWith(this, arguments);
					return this
				},
				fired: function () {
					return !!i
				}
			};
		return p
	};
	var i = [].slice;
	f.extend({
		Deferred: function (a) {
			var b = f.Callbacks("once memory"),
				c = f.Callbacks("once memory"),
				d = f.Callbacks("memory"),
				e = "pending",
				g = {
					resolve: b,
					reject: c,
					notify: d
				},
				h = {
					done: b.add,
					fail: c.add,
					progress: d.add,
					state: function () {
						return e
					},
					isResolved: b.fired,
					isRejected: c.fired,
					then: function (a, b, c) {
						i.done(a).fail(b).progress(c);
						return this
					},
					always: function () {
						i.done.apply(i, arguments).fail.apply(i, arguments);
						return this
					},
					pipe: function (a, b, c) {
						return f.Deferred(function (d) {
							f.each({
								done: [a, "resolve"],
								fail: [b, "reject"],
								progress: [c, "notify"]
							}, function (a, b) {
								var c = b[0],
									e = b[1],
									g;
								f.isFunction(c) ? i[a](function () {
									g = c.apply(this, arguments), g && f.isFunction(g.promise) ? g.promise().then(d.resolve, d.reject, d.notify) : d[e + "With"](this === i ? d : this, [g])
								}) : i[a](d[e])
							})
						}).promise()
					},
					promise: function (a) {
						if (a == null) {
							a = h
						} else {
							for (var b in h) {
								a[b] = h[b]
							}
						}
						return a
					}
				},
				i = h.promise({}),
				j;
			for (j in g) {
				i[j] = g[j].fire, i[j + "With"] = g[j].fireWith
			}
			i.done(function () {
				e = "resolved"
			}, c.disable, d.lock).fail(function () {
				e = "rejected"
			}, b.disable, d.lock), a && a.call(i, i);
			return i
		},
		when: function (a) {
			function m(a) {
				return function (b) {
					e[a] = arguments.length > 1 ? i.call(arguments, 0) : b, j.notifyWith(k, e)
				}
			}

			function l(a) {
				return function (c) {
					b[a] = arguments.length > 1 ? i.call(arguments, 0) : c, --g || j.resolveWith(j, b)
				}
			}
			var b = i.call(arguments, 0),
				c = 0,
				d = b.length,
				e = Array(d),
				g = d,
				h = d,
				j = d <= 1 && a && f.isFunction(a.promise) ? a : f.Deferred(),
				k = j.promise();
			if (d > 1) {
				for (; c < d; c++) {
					b[c] && b[c].promise && f.isFunction(b[c].promise) ? b[c].promise().then(l(c), j.reject, m(c)) : --g
				}
				g || j.resolveWith(j, b)
			} else {
				j !== a && j.resolveWith(j, d ? [a] : [])
			}
			return k
		}
	}), f.support = function () {
		var b, d, e, g, h, i, j, k, l, m, n, o, p = c.createElement("div"),
			q = c.documentElement;
		p.setAttribute("className", "t"), p.innerHTML = "   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>", d = p.getElementsByTagName("*"), e = p.getElementsByTagName("a")[0];
		if (!d || !d.length || !e) {
			return {}
		}
		g = c.createElement("select"), h = g.appendChild(c.createElement("option")), i = p.getElementsByTagName("input")[0], b = {
			leadingWhitespace: p.firstChild.nodeType === 3,
			tbody: !p.getElementsByTagName("tbody").length,
			htmlSerialize: !!p.getElementsByTagName("link").length,
			style: /top/.test(e.getAttribute("style")),
			hrefNormalized: e.getAttribute("href") === "/a",
			opacity: /^0.55/.test(e.style.opacity),
			cssFloat: !!e.style.cssFloat,
			checkOn: i.value === "on",
			optSelected: h.selected,
			getSetAttribute: p.className !== "t",
			enctype: !!c.createElement("form").enctype,
			html5Clone: c.createElement("nav").cloneNode(!0).outerHTML !== "<:nav></:nav>",
			submitBubbles: !0,
			changeBubbles: !0,
			focusinBubbles: !1,
			deleteExpando: !0,
			noCloneEvent: !0,
			inlineBlockNeedsLayout: !1,
			shrinkWrapBlocks: !1,
			reliableMarginRight: !0,
			pixelMargin: !0
		}, f.boxModel = b.boxModel = c.compatMode === "CSS1Compat", i.checked = !0, b.noCloneChecked = i.cloneNode(!0).checked, g.disabled = !0, b.optDisabled = !h.disabled;
		try {
			delete p.test
		} catch (r) {
			b.deleteExpando = !1
		}!p.addEventListener && p.attachEvent && p.fireEvent && (p.attachEvent("onclick", function () {
			b.noCloneEvent = !1
		}), p.cloneNode(!0).fireEvent("onclick")), i = c.createElement("input"), i.value = "t", i.setAttribute("type", "radio"), b.radioValue = i.value === "t", i.setAttribute("checked", "checked"), i.setAttribute("name", "t"), p.appendChild(i), j = c.createDocumentFragment(), j.appendChild(p.lastChild), b.checkClone = j.cloneNode(!0).cloneNode(!0).lastChild.checked, b.appendChecked = i.checked, j.removeChild(i), j.appendChild(p);
		if (p.attachEvent) {
			for (n in {
					submit: 1,
					change: 1,
					focusin: 1
				}) {
				m = "on" + n, o = m in p, o || (p.setAttribute(m, "return;"), o = typeof p[m] == "function"), b[n + "Bubbles"] = o
			}
		}
		j.removeChild(p), j = g = h = p = i = null, f(function () {
			var d, e, g, h, i, j, l, m, n, q, r, s, t, u = c.getElementsByTagName("body")[0];
			!u || (m = 1, t = "padding:0;margin:0;border:", r = "position:absolute;top:0;left:0;width:1px;height:1px;", s = t + "0;visibility:hidden;", n = "style='" + r + t + "5px solid #000;", q = "<div " + n + "display:block;'><div style='" + t + "0;display:block;overflow:hidden;'></div></div>" + "<table " + n + "' cellpadding='0' cellspacing='0'>" + "<tr><td></td></tr></table>", d = c.createElement("div"), d.style.cssText = s + "width:0;height:0;position:static;top:0;margin-top:" + m + "px", u.insertBefore(d, u.firstChild), p = c.createElement("div"), d.appendChild(p), p.innerHTML = "<table><tr><td style='" + t + "0;display:none'></td><td>t</td></tr></table>", k = p.getElementsByTagName("td"), o = k[0].offsetHeight === 0, k[0].style.display = "", k[1].style.display = "none", b.reliableHiddenOffsets = o && k[0].offsetHeight === 0, a.getComputedStyle && (p.innerHTML = "", l = c.createElement("div"), l.style.width = "0", l.style.marginRight = "0", p.style.width = "2px", p.appendChild(l), b.reliableMarginRight = (parseInt((a.getComputedStyle(l, null) || {
				marginRight: 0
			}).marginRight, 10) || 0) === 0), typeof p.style.zoom != "undefined" && (p.innerHTML = "", p.style.width = p.style.padding = "1px", p.style.border = 0, p.style.overflow = "hidden", p.style.display = "inline", p.style.zoom = 1, b.inlineBlockNeedsLayout = p.offsetWidth === 3, p.style.display = "block", p.style.overflow = "visible", p.innerHTML = "<div style='width:5px;'></div>", b.shrinkWrapBlocks = p.offsetWidth !== 3), p.style.cssText = r + s, p.innerHTML = q, e = p.firstChild, g = e.firstChild, i = e.nextSibling.firstChild.firstChild, j = {
				doesNotAddBorder: g.offsetTop !== 5,
				doesAddBorderForTableAndCells: i.offsetTop === 5
			}, g.style.position = "fixed", g.style.top = "20px", j.fixedPosition = g.offsetTop === 20 || g.offsetTop === 15, g.style.position = g.style.top = "", e.style.overflow = "hidden", e.style.position = "relative", j.subtractsBorderForOverflowNotVisible = g.offsetTop === -5, j.doesNotIncludeMarginInBodyOffset = u.offsetTop !== m, a.getComputedStyle && (p.style.marginTop = "1%", b.pixelMargin = (a.getComputedStyle(p, null) || {
				marginTop: 0
			}).marginTop !== "1%"), typeof d.style.zoom != "undefined" && (d.style.zoom = 1), u.removeChild(d), l = p = d = null, f.extend(b, j))
		});
		return b
	}();
	var j = /^(?:\{.*\}|\[.*\])$/,
		k = /([A-Z])/g;
	f.extend({
		cache: {},
		uuid: 0,
		expando: "jQuery" + (f.fn.jquery + Math.random()).replace(/\D/g, ""),
		noData: {
			embed: !0,
			object: "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
			applet: !0
		},
		hasData: function (a) {
			a = a.nodeType ? f.cache[a[f.expando]] : a[f.expando];
			return !!a && !m(a)
		},
		data: function (a, c, d, e) {
			if (!!f.acceptData(a)) {
				var g, h, i, j = f.expando,
					k = typeof c == "string",
					l = a.nodeType,
					m = l ? f.cache : a,
					n = l ? a[j] : a[j] && j,
					o = c === "events";
				if ((!n || !m[n] || !o && !e && !m[n].data) && k && d === b) {
					return
				}
				n || (l ? a[j] = n = ++f.uuid : n = j), m[n] || (m[n] = {}, l || (m[n].toJSON = f.noop));
				if (typeof c == "object" || typeof c == "function") {
					e ? m[n] = f.extend(m[n], c) : m[n].data = f.extend(m[n].data, c)
				}
				g = h = m[n], e || (h.data || (h.data = {}), h = h.data), d !== b && (h[f.camelCase(c)] = d);
				if (o && !h[c]) {
					return g.events
				}
				k ? (i = h[c], i == null && (i = h[f.camelCase(c)])) : i = h;
				return i
			}
		},
		removeData: function (a, b, c) {
			if (!!f.acceptData(a)) {
				var d, e, g, h = f.expando,
					i = a.nodeType,
					j = i ? f.cache : a,
					k = i ? a[h] : h;
				if (!j[k]) {
					return
				}
				if (b) {
					d = c ? j[k] : j[k].data;
					if (d) {
						f.isArray(b) || (b in d ? b = [b] : (b = f.camelCase(b), b in d ? b = [b] : b = b.split(" ")));
						for (e = 0, g = b.length; e < g; e++) {
							delete d[b[e]]
						}
						if (!(c ? m : f.isEmptyObject)(d)) {
							return
						}
					}
				}
				if (!c) {
					delete j[k].data;
					if (!m(j[k])) {
						return
					}
				}
				f.support.deleteExpando || !j.setInterval ? delete j[k] : j[k] = null, i && (f.support.deleteExpando ? delete a[h] : a.removeAttribute ? a.removeAttribute(h) : a[h] = null)
			}
		},
		_data: function (a, b, c) {
			return f.data(a, b, c, !0)
		},
		acceptData: function (a) {
			if (a.nodeName) {
				var b = f.noData[a.nodeName.toLowerCase()];
				if (b) {
					return b !== !0 && a.getAttribute("classid") === b
				}
			}
			return !0
		}
	}), f.fn.extend({
		data: function (a, c) {
			var d, e, g, h, i, j = this[0],
				k = 0,
				m = null;
			if (a === b) {
				if (this.length) {
					m = f.data(j);
					if (j.nodeType === 1 && !f._data(j, "parsedAttrs")) {
						g = j.attributes;
						for (i = g.length; k < i; k++) {
							h = g[k].name, h.indexOf("data-") === 0 && (h = f.camelCase(h.substring(5)), l(j, h, m[h]))
						}
						f._data(j, "parsedAttrs", !0)
					}
				}
				return m
			}
			if (typeof a == "object") {
				return this.each(function () {
					f.data(this, a)
				})
			}
			d = a.split(".", 2), d[1] = d[1] ? "." + d[1] : "", e = d[1] + "!";
			return f.access(this, function (c) {
				if (c === b) {
					m = this.triggerHandler("getData" + e, [d[0]]), m === b && j && (m = f.data(j, a), m = l(j, a, m));
					return m === b && d[1] ? this.data(d[0]) : m
				}
				d[1] = c, this.each(function () {
					var b = f(this);
					b.triggerHandler("setData" + e, d), f.data(this, a, c), b.triggerHandler("changeData" + e, d)
				})
			}, null, c, arguments.length > 1, null, !1)
		},
		removeData: function (a) {
			return this.each(function () {
				f.removeData(this, a)
			})
		}
	}), f.extend({
		_mark: function (a, b) {
			a && (b = (b || "fx") + "mark", f._data(a, b, (f._data(a, b) || 0) + 1))
		},
		_unmark: function (a, b, c) {
			a !== !0 && (c = b, b = a, a = !1);
			if (b) {
				c = c || "fx";
				var d = c + "mark",
					e = a ? 0 : (f._data(b, d) || 1) - 1;
				e ? f._data(b, d, e) : (f.removeData(b, d, !0), n(b, c, "mark"))
			}
		},
		queue: function (a, b, c) {
			var d;
			if (a) {
				b = (b || "fx") + "queue", d = f._data(a, b), c && (!d || f.isArray(c) ? d = f._data(a, b, f.makeArray(c)) : d.push(c));
				return d || []
			}
		},
		dequeue: function (a, b) {
			b = b || "fx";
			var c = f.queue(a, b),
				d = c.shift(),
				e = {};
			d === "inprogress" && (d = c.shift()), d && (b === "fx" && c.unshift("inprogress"), f._data(a, b + ".run", e), d.call(a, function () {
				f.dequeue(a, b)
			}, e)), c.length || (f.removeData(a, b + "queue " + b + ".run", !0), n(a, b, "queue"))
		}
	}), f.fn.extend({
		queue: function (a, c) {
			var d = 2;
			typeof a != "string" && (c = a, a = "fx", d--);
			if (arguments.length < d) {
				return f.queue(this[0], a)
			}
			return c === b ? this : this.each(function () {
				var b = f.queue(this, a, c);
				a === "fx" && b[0] !== "inprogress" && f.dequeue(this, a)
			})
		},
		dequeue: function (a) {
			return this.each(function () {
				f.dequeue(this, a)
			})
		},
		delay: function (a, b) {
			a = f.fx ? f.fx.speeds[a] || a : a, b = b || "fx";
			return this.queue(b, function (b, c) {
				var d = setTimeout(b, a);
				c.stop = function () {
					clearTimeout(d)
				}
			})
		},
		clearQueue: function (a) {
			return this.queue(a || "fx", [])
		},
		promise: function (a, c) {
			function m() {
				--h || d.resolveWith(e, [e])
			}
			typeof a != "string" && (c = a, a = b), a = a || "fx";
			var d = f.Deferred(),
				e = this,
				g = e.length,
				h = 1,
				i = a + "defer",
				j = a + "queue",
				k = a + "mark",
				l;
			while (g--) {
				if (l = f.data(e[g], i, b, !0) || (f.data(e[g], j, b, !0) || f.data(e[g], k, b, !0)) && f.data(e[g], i, f.Callbacks("once memory"), !0)) {
					h++, l.add(m)
				}
			}
			m();
			return d.promise(c)
		}
	});
	var o = /[\n\t\r]/g,
		p = /\s+/,
		q = /\r/g,
		r = /^(?:button|input)$/i,
		s = /^(?:button|input|object|select|textarea)$/i,
		t = /^a(?:rea)?$/i,
		u = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,
		v = f.support.getSetAttribute,
		w, x, y;
	f.fn.extend({
		attr: function (a, b) {
			return f.access(this, f.attr, a, b, arguments.length > 1)
		},
		removeAttr: function (a) {
			return this.each(function () {
				f.removeAttr(this, a)
			})
		},
		prop: function (a, b) {
			return f.access(this, f.prop, a, b, arguments.length > 1)
		},
		removeProp: function (a) {
			a = f.propFix[a] || a;
			return this.each(function () {
				try {
					this[a] = b, delete this[a]
				} catch (c) {}
			})
		},
		addClass: function (a) {
			var b, c, d, e, g, h, i;
			if (f.isFunction(a)) {
				return this.each(function (b) {
					f(this).addClass(a.call(this, b, this.className))
				})
			}
			if (a && typeof a == "string") {
				b = a.split(p);
				for (c = 0, d = this.length; c < d; c++) {
					e = this[c];
					if (e.nodeType === 1) {
						if (!e.className && b.length === 1) {
							e.className = a
						} else {
							g = " " + e.className + " ";
							for (h = 0, i = b.length; h < i; h++) {
								~g.indexOf(" " + b[h] + " ") || (g += b[h] + " ")
							}
							e.className = f.trim(g)
						}
					}
				}
			}
			return this
		},
		removeClass: function (a) {
			var c, d, e, g, h, i, j;
			if (f.isFunction(a)) {
				return this.each(function (b) {
					f(this).removeClass(a.call(this, b, this.className))
				})
			}
			if (a && typeof a == "string" || a === b) {
				c = (a || "").split(p);
				for (d = 0, e = this.length; d < e; d++) {
					g = this[d];
					if (g.nodeType === 1 && g.className) {
						if (a) {
							h = (" " + g.className + " ").replace(o, " ");
							for (i = 0, j = c.length; i < j; i++) {
								h = h.replace(" " + c[i] + " ", " ")
							}
							g.className = f.trim(h)
						} else {
							g.className = ""
						}
					}
				}
			}
			return this
		},
		toggleClass: function (a, b) {
			var c = typeof a,
				d = typeof b == "boolean";
			if (f.isFunction(a)) {
				return this.each(function (c) {
					f(this).toggleClass(a.call(this, c, this.className, b), b)
				})
			}
			return this.each(function () {
				if (c === "string") {
					var e, g = 0,
						h = f(this),
						i = b,
						j = a.split(p);
					while (e = j[g++]) {
						i = d ? i : !h.hasClass(e), h[i ? "addClass" : "removeClass"](e)
					}
				} else {
					if (c === "undefined" || c === "boolean") {
						this.className && f._data(this, "__className__", this.className), this.className = this.className || a === !1 ? "" : f._data(this, "__className__") || ""
					}
				}
			})
		},
		hasClass: function (a) {
			var b = " " + a + " ",
				c = 0,
				d = this.length;
			for (; c < d; c++) {
				if (this[c].nodeType === 1 && (" " + this[c].className + " ").replace(o, " ").indexOf(b) > -1) {
					return !0
				}
			}
			return !1
		},
		val: function (a) {
			var c, d, e, g = this[0];
			if (!!arguments.length) {
				e = f.isFunction(a);
				return this.each(function (d) {
					var g = f(this),
						h;
					if (this.nodeType === 1) {
						e ? h = a.call(this, d, g.val()) : h = a, h == null ? h = "" : typeof h == "number" ? h += "" : f.isArray(h) && (h = f.map(h, function (a) {
							return a == null ? "" : a + ""
						})), c = f.valHooks[this.type] || f.valHooks[this.nodeName.toLowerCase()];
						if (!c || !("set" in c) || c.set(this, h, "value") === b) {
							this.value = h
						}
					}
				})
			}
			if (g) {
				c = f.valHooks[g.type] || f.valHooks[g.nodeName.toLowerCase()];
				if (c && "get" in c && (d = c.get(g, "value")) !== b) {
					return d
				}
				d = g.value;
				return typeof d == "string" ? d.replace(q, "") : d == null ? "" : d
			}
		}
	}), f.extend({
		valHooks: {
			option: {
				get: function (a) {
					var b = a.attributes.value;
					return !b || b.specified ? a.value : a.text
				}
			},
			select: {
				get: function (a) {
					var b, c, d, e, g = a.selectedIndex,
						h = [],
						i = a.options,
						j = a.type === "select-one";
					if (g < 0) {
						return null
					}
					c = j ? g : 0, d = j ? g + 1 : i.length;
					for (; c < d; c++) {
						e = i[c];
						if (e.selected && (f.support.optDisabled ? !e.disabled : e.getAttribute("disabled") === null) && (!e.parentNode.disabled || !f.nodeName(e.parentNode, "optgroup"))) {
							b = f(e).val();
							if (j) {
								return b
							}
							h.push(b)
						}
					}
					if (j && !h.length && i.length) {
						return f(i[g]).val()
					}
					return h
				},
				set: function (a, b) {
					var c = f.makeArray(b);
					f(a).find("option").each(function () {
						this.selected = f.inArray(f(this).val(), c) >= 0
					}), c.length || (a.selectedIndex = -1);
					return c
				}
			}
		},
		attrFn: {
			val: !0,
			css: !0,
			html: !0,
			text: !0,
			data: !0,
			width: !0,
			height: !0,
			offset: !0
		},
		attr: function (a, c, d, e) {
			var g, h, i, j = a.nodeType;
			if (!!a && j !== 3 && j !== 8 && j !== 2) {
				if (e && c in f.attrFn) {
					return f(a)[c](d)
				}
				if (typeof a.getAttribute == "undefined") {
					return f.prop(a, c, d)
				}
				i = j !== 1 || !f.isXMLDoc(a), i && (c = c.toLowerCase(), h = f.attrHooks[c] || (u.test(c) ? x : w));
				if (d !== b) {
					if (d === null) {
						f.removeAttr(a, c);
						return
					}
					if (h && "set" in h && i && (g = h.set(a, d, c)) !== b) {
						return g
					}
					a.setAttribute(c, "" + d);
					return d
				}
				if (h && "get" in h && i && (g = h.get(a, c)) !== null) {
					return g
				}
				g = a.getAttribute(c);
				return g === null ? b : g
			}
		},
		removeAttr: function (a, b) {
			var c, d, e, g, h, i = 0;
			if (b && a.nodeType === 1) {
				d = b.toLowerCase().split(p), g = d.length;
				for (; i < g; i++) {
					e = d[i], e && (c = f.propFix[e] || e, h = u.test(e), h || f.attr(a, e, ""), a.removeAttribute(v ? e : c), h && c in a && (a[c] = !1))
				}
			}
		},
		attrHooks: {
			type: {
				set: function (a, b) {
					if (r.test(a.nodeName) && a.parentNode) {
						f.error("type property can't be changed")
					} else {
						if (!f.support.radioValue && b === "radio" && f.nodeName(a, "input")) {
							var c = a.value;
							a.setAttribute("type", b), c && (a.value = c);
							return b
						}
					}
				}
			},
			value: {
				get: function (a, b) {
					if (w && f.nodeName(a, "button")) {
						return w.get(a, b)
					}
					return b in a ? a.value : null
				},
				set: function (a, b, c) {
					if (w && f.nodeName(a, "button")) {
						return w.set(a, b, c)
					}
					a.value = b
				}
			}
		},
		propFix: {
			tabindex: "tabIndex",
			readonly: "readOnly",
			"for": "htmlFor",
			"class": "className",
			maxlength: "maxLength",
			cellspacing: "cellSpacing",
			cellpadding: "cellPadding",
			rowspan: "rowSpan",
			colspan: "colSpan",
			usemap: "useMap",
			frameborder: "frameBorder",
			contenteditable: "contentEditable"
		},
		prop: function (a, c, d) {
			var e, g, h, i = a.nodeType;
			if (!!a && i !== 3 && i !== 8 && i !== 2) {
				h = i !== 1 || !f.isXMLDoc(a), h && (c = f.propFix[c] || c, g = f.propHooks[c]);
				return d !== b ? g && "set" in g && (e = g.set(a, d, c)) !== b ? e : a[c] = d : g && "get" in g && (e = g.get(a, c)) !== null ? e : a[c]
			}
		},
		propHooks: {
			tabIndex: {
				get: function (a) {
					var c = a.getAttributeNode("tabindex");
					return c && c.specified ? parseInt(c.value, 10) : s.test(a.nodeName) || t.test(a.nodeName) && a.href ? 0 : b
				}
			}
		}
	}), f.attrHooks.tabindex = f.propHooks.tabIndex, x = {
		get: function (a, c) {
			var d, e = f.prop(a, c);
			return e === !0 || typeof e != "boolean" && (d = a.getAttributeNode(c)) && d.nodeValue !== !1 ? c.toLowerCase() : b
		},
		set: function (a, b, c) {
			var d;
			b === !1 ? f.removeAttr(a, c) : (d = f.propFix[c] || c, d in a && (a[d] = !0), a.setAttribute(c, c.toLowerCase()));
			return c
		}
	}, v || (y = {
		name: !0,
		id: !0,
		coords: !0
	}, w = f.valHooks.button = {
		get: function (a, c) {
			var d;
			d = a.getAttributeNode(c);
			return d && (y[c] ? d.nodeValue !== "" : d.specified) ? d.nodeValue : b
		},
		set: function (a, b, d) {
			var e = a.getAttributeNode(d);
			e || (e = c.createAttribute(d), a.setAttributeNode(e));
			return e.nodeValue = b + ""
		}
	}, f.attrHooks.tabindex.set = w.set, f.each(["width", "height"], function (a, b) {
		f.attrHooks[b] = f.extend(f.attrHooks[b], {
			set: function (a, c) {
				if (c === "") {
					a.setAttribute(b, "auto");
					return c
				}
			}
		})
	}), f.attrHooks.contenteditable = {
		get: w.get,
		set: function (a, b, c) {
			b === "" && (b = "false"), w.set(a, b, c)
		}
	}), f.support.hrefNormalized || f.each(["href", "src", "width", "height"], function (a, c) {
		f.attrHooks[c] = f.extend(f.attrHooks[c], {
			get: function (a) {
				var d = a.getAttribute(c, 2);
				return d === null ? b : d
			}
		})
	}), f.support.style || (f.attrHooks.style = {
		get: function (a) {
			return a.style.cssText.toLowerCase() || b
		},
		set: function (a, b) {
			return a.style.cssText = "" + b
		}
	}), f.support.optSelected || (f.propHooks.selected = f.extend(f.propHooks.selected, {
		get: function (a) {
			var b = a.parentNode;
			b && (b.selectedIndex, b.parentNode && b.parentNode.selectedIndex);
			return null
		}
	})), f.support.enctype || (f.propFix.enctype = "encoding"), f.support.checkOn || f.each(["radio", "checkbox"], function () {
		f.valHooks[this] = {
			get: function (a) {
				return a.getAttribute("value") === null ? "on" : a.value
			}
		}
	}), f.each(["radio", "checkbox"], function () {
		f.valHooks[this] = f.extend(f.valHooks[this], {
			set: function (a, b) {
				if (f.isArray(b)) {
					return a.checked = f.inArray(f(a).val(), b) >= 0
				}
			}
		})
	});
	var z = /^(?:textarea|input|select)$/i,
		A = /^([^\.]*)?(?:\.(.+))?$/,
		B = /(?:^|\s)hover(\.\S+)?\b/,
		C = /^key/,
		D = /^(?:mouse|contextmenu)|click/,
		E = /^(?:focusinfocus|focusoutblur)$/,
		F = /^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/,
		G = function (a) {
			var b = F.exec(a);
			b && (b[1] = (b[1] || "").toLowerCase(), b[3] = b[3] && new RegExp("(?:^|\\s)" + b[3] + "(?:\\s|$)"));
			return b
		},
		H = function (a, b) {
			var c = a.attributes || {};
			return (!b[1] || a.nodeName.toLowerCase() === b[1]) && (!b[2] || (c.id || {}).value === b[2]) && (!b[3] || b[3].test((c["class"] || {}).value))
		},
		I = function (a) {
			return f.event.special.hover ? a : a.replace(B, "mouseenter$1 mouseleave$1")
		};
	f.event = {
			add: function (a, c, d, e, g) {
				var h, i, j, k, l, m, n, o, p, q, r, s;
				if (!(a.nodeType === 3 || a.nodeType === 8 || !c || !d || !(h = f._data(a)))) {
					d.handler && (p = d, d = p.handler, g = p.selector), d.guid || (d.guid = f.guid++), j = h.events, j || (h.events = j = {}), i = h.handle, i || (h.handle = i = function (a) {
						return typeof f != "undefined" && (!a || f.event.triggered !== a.type) ? f.event.dispatch.apply(i.elem, arguments) : b
					}, i.elem = a), c = f.trim(I(c)).split(" ");
					for (k = 0; k < c.length; k++) {
						l = A.exec(c[k]) || [], m = l[1], n = (l[2] || "").split(".").sort(), s = f.event.special[m] || {}, m = (g ? s.delegateType : s.bindType) || m, s = f.event.special[m] || {}, o = f.extend({
							type: m,
							origType: l[1],
							data: e,
							handler: d,
							guid: d.guid,
							selector: g,
							quick: g && G(g),
							namespace: n.join(".")
						}, p), r = j[m];
						if (!r) {
							r = j[m] = [], r.delegateCount = 0;
							if (!s.setup || s.setup.call(a, e, n, i) === !1) {
								a.addEventListener ? a.addEventListener(m, i, !1) : a.attachEvent && a.attachEvent("on" + m, i)
							}
						}
						s.add && (s.add.call(a, o), o.handler.guid || (o.handler.guid = d.guid)), g ? r.splice(r.delegateCount++, 0, o) : r.push(o), f.event.global[m] = !0
					}
					a = null
				}
			},
			global: {},
			remove: function (a, b, c, d, e) {
				var g = f.hasData(a) && f._data(a),
					h, i, j, k, l, m, n, o, p, q, r, s;
				if (!!g && !!(o = g.events)) {
					b = f.trim(I(b || "")).split(" ");
					for (h = 0; h < b.length; h++) {
						i = A.exec(b[h]) || [], j = k = i[1], l = i[2];
						if (!j) {
							for (j in o) {
								f.event.remove(a, j + b[h], c, d, !0)
							}
							continue
						}
						p = f.event.special[j] || {}, j = (d ? p.delegateType : p.bindType) || j, r = o[j] || [], m = r.length, l = l ? new RegExp("(^|\\.)" + l.split(".").sort().join("\\.(?:.*\\.)?") + "(\\.|$)") : null;
						for (n = 0; n < r.length; n++) {
							s = r[n], (e || k === s.origType) && (!c || c.guid === s.guid) && (!l || l.test(s.namespace)) && (!d || d === s.selector || d === "**" && s.selector) && (r.splice(n--, 1), s.selector && r.delegateCount--, p.remove && p.remove.call(a, s))
						}
						r.length === 0 && m !== r.length && ((!p.teardown || p.teardown.call(a, l) === !1) && f.removeEvent(a, j, g.handle), delete o[j])
					}
					f.isEmptyObject(o) && (q = g.handle, q && (q.elem = null), f.removeData(a, ["events", "handle"], !0))
				}
			},
			customEvent: {
				getData: !0,
				setData: !0,
				changeData: !0
			},
			trigger: function (c, d, e, g) {
				if (!e || e.nodeType !== 3 && e.nodeType !== 8) {
					var h = c.type || c,
						i = [],
						j, k, l, m, n, o, p, q, r, s;
					if (E.test(h + f.event.triggered)) {
						return
					}
					h.indexOf("!") >= 0 && (h = h.slice(0, -1), k = !0), h.indexOf(".") >= 0 && (i = h.split("."), h = i.shift(), i.sort());
					if ((!e || f.event.customEvent[h]) && !f.event.global[h]) {
						return
					}
					c = typeof c == "object" ? c[f.expando] ? c : new f.Event(h, c) : new f.Event(h), c.type = h, c.isTrigger = !0, c.exclusive = k, c.namespace = i.join("."), c.namespace_re = c.namespace ? new RegExp("(^|\\.)" + i.join("\\.(?:.*\\.)?") + "(\\.|$)") : null, o = h.indexOf(":") < 0 ? "on" + h : "";
					if (!e) {
						j = f.cache;
						for (l in j) {
							j[l].events && j[l].events[h] && f.event.trigger(c, d, j[l].handle.elem, !0)
						}
						return
					}
					c.result = b, c.target || (c.target = e), d = d != null ? f.makeArray(d) : [], d.unshift(c), p = f.event.special[h] || {};
					if (p.trigger && p.trigger.apply(e, d) === !1) {
						return
					}
					r = [
						[e, p.bindType || h]
					];
					if (!g && !p.noBubble && !f.isWindow(e)) {
						s = p.delegateType || h, m = E.test(s + h) ? e : e.parentNode, n = null;
						for (; m; m = m.parentNode) {
							r.push([m, s]), n = m
						}
						n && n === e.ownerDocument && r.push([n.defaultView || n.parentWindow || a, s])
					}
					for (l = 0; l < r.length && !c.isPropagationStopped(); l++) {
						m = r[l][0], c.type = r[l][1], q = (f._data(m, "events") || {})[c.type] && f._data(m, "handle"), q && q.apply(m, d), q = o && m[o], q && f.acceptData(m) && q.apply(m, d) === !1 && c.preventDefault()
					}
					c.type = h, !g && !c.isDefaultPrevented() && (!p._default || p._default.apply(e.ownerDocument, d) === !1) && (h !== "click" || !f.nodeName(e, "a")) && f.acceptData(e) && o && e[h] && (h !== "focus" && h !== "blur" || c.target.offsetWidth !== 0) && !f.isWindow(e) && (n = e[o], n && (e[o] = null), f.event.triggered = h, e[h](), f.event.triggered = b, n && (e[o] = n));
					return c.result
				}
			},
			dispatch: function (c) {
				c = f.event.fix(c || a.event);
				var d = (f._data(this, "events") || {})[c.type] || [],
					e = d.delegateCount,
					g = [].slice.call(arguments, 0),
					h = !c.exclusive && !c.namespace,
					i = f.event.special[c.type] || {},
					j = [],
					k, l, m, n, o, p, q, r, s, t, u;
				g[0] = c, c.delegateTarget = this;
				if (!i.preDispatch || i.preDispatch.call(this, c) !== !1) {
					if (e && (!c.button || c.type !== "click")) {
						n = f(this), n.context = this.ownerDocument || this;
						for (m = c.target; m != this; m = m.parentNode || this) {
							if (m.disabled !== !0) {
								p = {}, r = [], n[0] = m;
								for (k = 0; k < e; k++) {
									s = d[k], t = s.selector, p[t] === b && (p[t] = s.quick ? H(m, s.quick) : n.is(t)), p[t] && r.push(s)
								}
								r.length && j.push({
									elem: m,
									matches: r
								})
							}
						}
					}
					d.length > e && j.push({
						elem: this,
						matches: d.slice(e)
					});
					for (k = 0; k < j.length && !c.isPropagationStopped(); k++) {
						q = j[k], c.currentTarget = q.elem;
						for (l = 0; l < q.matches.length && !c.isImmediatePropagationStopped(); l++) {
							s = q.matches[l];
							if (h || !c.namespace && !s.namespace || c.namespace_re && c.namespace_re.test(s.namespace)) {
								c.data = s.data, c.handleObj = s, o = ((f.event.special[s.origType] || {}).handle || s.handler).apply(q.elem, g), o !== b && (c.result = o, o === !1 && (c.preventDefault(), c.stopPropagation()))
							}
						}
					}
					i.postDispatch && i.postDispatch.call(this, c);
					return c.result
				}
			},
			props: "attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),
			fixHooks: {},
			keyHooks: {
				props: "char charCode key keyCode".split(" "),
				filter: function (a, b) {
					a.which == null && (a.which = b.charCode != null ? b.charCode : b.keyCode);
					return a
				}
			},
			mouseHooks: {
				props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
				filter: function (a, d) {
					var e, f, g, h = d.button,
						i = d.fromElement;
					a.pageX == null && d.clientX != null && (e = a.target.ownerDocument || c, f = e.documentElement, g = e.body, a.pageX = d.clientX + (f && f.scrollLeft || g && g.scrollLeft || 0) - (f && f.clientLeft || g && g.clientLeft || 0), a.pageY = d.clientY + (f && f.scrollTop || g && g.scrollTop || 0) - (f && f.clientTop || g && g.clientTop || 0)), !a.relatedTarget && i && (a.relatedTarget = i === a.target ? d.toElement : i), !a.which && h !== b && (a.which = h & 1 ? 1 : h & 2 ? 3 : h & 4 ? 2 : 0);
					return a
				}
			},
			fix: function (a) {
				if (a[f.expando]) {
					return a
				}
				var d, e, g = a,
					h = f.event.fixHooks[a.type] || {},
					i = h.props ? this.props.concat(h.props) : this.props;
				a = f.Event(g);
				for (d = i.length; d;) {
					e = i[--d], a[e] = g[e]
				}
				a.target || (a.target = g.srcElement || c), a.target.nodeType === 3 && (a.target = a.target.parentNode), a.metaKey === b && (a.metaKey = a.ctrlKey);
				return h.filter ? h.filter(a, g) : a
			},
			special: {
				ready: {
					setup: f.bindReady
				},
				load: {
					noBubble: !0
				},
				focus: {
					delegateType: "focusin"
				},
				blur: {
					delegateType: "focusout"
				},
				beforeunload: {
					setup: function (a, b, c) {
						f.isWindow(this) && (this.onbeforeunload = c)
					},
					teardown: function (a, b) {
						this.onbeforeunload === b && (this.onbeforeunload = null)
					}
				}
			},
			simulate: function (a, b, c, d) {
				var e = f.extend(new f.Event, c, {
					type: a,
					isSimulated: !0,
					originalEvent: {}
				});
				d ? f.event.trigger(e, null, b) : f.event.dispatch.call(b, e), e.isDefaultPrevented() && c.preventDefault()
			}
		}, f.event.handle = f.event.dispatch, f.removeEvent = c.removeEventListener ? function (a, b, c) {
			a.removeEventListener && a.removeEventListener(b, c, !1)
		} : function (a, b, c) {
			a.detachEvent && a.detachEvent("on" + b, c)
		}, f.Event = function (a, b) {
			if (!(this instanceof f.Event)) {
				return new f.Event(a, b)
			}
			a && a.type ? (this.originalEvent = a, this.type = a.type, this.isDefaultPrevented = a.defaultPrevented || a.returnValue === !1 || a.getPreventDefault && a.getPreventDefault() ? K : J) : this.type = a, b && f.extend(this, b), this.timeStamp = a && a.timeStamp || f.now(), this[f.expando] = !0
		}, f.Event.prototype = {
			preventDefault: function () {
				this.isDefaultPrevented = K;
				var a = this.originalEvent;
				!a || (a.preventDefault ? a.preventDefault() : a.returnValue = !1)
			},
			stopPropagation: function () {
				this.isPropagationStopped = K;
				var a = this.originalEvent;
				!a || (a.stopPropagation && a.stopPropagation(), a.cancelBubble = !0)
			},
			stopImmediatePropagation: function () {
				this.isImmediatePropagationStopped = K, this.stopPropagation()
			},
			isDefaultPrevented: J,
			isPropagationStopped: J,
			isImmediatePropagationStopped: J
		}, f.each({
			mouseenter: "mouseover",
			mouseleave: "mouseout"
		}, function (a, b) {
			f.event.special[a] = {
				delegateType: b,
				bindType: b,
				handle: function (a) {
					var c = this,
						d = a.relatedTarget,
						e = a.handleObj,
						g = e.selector,
						h;
					if (!d || d !== c && !f.contains(c, d)) {
						a.type = e.origType, h = e.handler.apply(this, arguments), a.type = b
					}
					return h
				}
			}
		}), f.support.submitBubbles || (f.event.special.submit = {
			setup: function () {
				if (f.nodeName(this, "form")) {
					return !1
				}
				f.event.add(this, "click._submit keypress._submit", function (a) {
					var c = a.target,
						d = f.nodeName(c, "input") || f.nodeName(c, "button") ? c.form : b;
					d && !d._submit_attached && (f.event.add(d, "submit._submit", function (a) {
						a._submit_bubble = !0
					}), d._submit_attached = !0)
				})
			},
			postDispatch: function (a) {
				a._submit_bubble && (delete a._submit_bubble, this.parentNode && !a.isTrigger && f.event.simulate("submit", this.parentNode, a, !0))
			},
			teardown: function () {
				if (f.nodeName(this, "form")) {
					return !1
				}
				f.event.remove(this, "._submit")
			}
		}), f.support.changeBubbles || (f.event.special.change = {
			setup: function () {
				if (z.test(this.nodeName)) {
					if (this.type === "checkbox" || this.type === "radio") {
						f.event.add(this, "propertychange._change", function (a) {
							a.originalEvent.propertyName === "checked" && (this._just_changed = !0)
						}), f.event.add(this, "click._change", function (a) {
							this._just_changed && !a.isTrigger && (this._just_changed = !1, f.event.simulate("change", this, a, !0))
						})
					}
					return !1
				}
				f.event.add(this, "beforeactivate._change", function (a) {
					var b = a.target;
					z.test(b.nodeName) && !b._change_attached && (f.event.add(b, "change._change", function (a) {
						this.parentNode && !a.isSimulated && !a.isTrigger && f.event.simulate("change", this.parentNode, a, !0)
					}), b._change_attached = !0)
				})
			},
			handle: function (a) {
				var b = a.target;
				if (this !== b || a.isSimulated || a.isTrigger || b.type !== "radio" && b.type !== "checkbox") {
					return a.handleObj.handler.apply(this, arguments)
				}
			},
			teardown: function () {
				f.event.remove(this, "._change");
				return z.test(this.nodeName)
			}
		}), f.support.focusinBubbles || f.each({
			focus: "focusin",
			blur: "focusout"
		}, function (a, b) {
			var d = 0,
				e = function (a) {
					f.event.simulate(b, a.target, f.event.fix(a), !0)
				};
			f.event.special[b] = {
				setup: function () {
					d++ === 0 && c.addEventListener(a, e, !0)
				},
				teardown: function () {
					--d === 0 && c.removeEventListener(a, e, !0)
				}
			}
		}), f.fn.extend({
			on: function (a, c, d, e, g) {
				var h, i;
				if (typeof a == "object") {
					typeof c != "string" && (d = d || c, c = b);
					for (i in a) {
						this.on(i, c, d, a[i], g)
					}
					return this
				}
				d == null && e == null ? (e = c, d = c = b) : e == null && (typeof c == "string" ? (e = d, d = b) : (e = d, d = c, c = b));
				if (e === !1) {
					e = J
				} else {
					if (!e) {
						return this
					}
				}
				g === 1 && (h = e, e = function (a) {
					f().off(a);
					return h.apply(this, arguments)
				}, e.guid = h.guid || (h.guid = f.guid++));
				return this.each(function () {
					f.event.add(this, a, e, d, c)
				})
			},
			one: function (a, b, c, d) {
				return this.on(a, b, c, d, 1)
			},
			off: function (a, c, d) {
				if (a && a.preventDefault && a.handleObj) {
					var e = a.handleObj;
					f(a.delegateTarget).off(e.namespace ? e.origType + "." + e.namespace : e.origType, e.selector, e.handler);
					return this
				}
				if (typeof a == "object") {
					for (var g in a) {
						this.off(g, c, a[g])
					}
					return this
				}
				if (c === !1 || typeof c == "function") {
					d = c, c = b
				}
				d === !1 && (d = J);
				return this.each(function () {
					f.event.remove(this, a, d, c)
				})
			},
			bind: function (a, b, c) {
				return this.on(a, null, b, c)
			},
			unbind: function (a, b) {
				return this.off(a, null, b)
			},
			live: function (a, b, c) {
				f(this.context).on(a, this.selector, b, c);
				return this
			},
			die: function (a, b) {
				f(this.context).off(a, this.selector || "**", b);
				return this
			},
			delegate: function (a, b, c, d) {
				return this.on(b, a, c, d)
			},
			undelegate: function (a, b, c) {
				return arguments.length == 1 ? this.off(a, "**") : this.off(b, a, c)
			},
			trigger: function (a, b) {
				return this.each(function () {
					f.event.trigger(a, b, this)
				})
			},
			triggerHandler: function (a, b) {
				if (this[0]) {
					return f.event.trigger(a, b, this[0], !0)
				}
			},
			toggle: function (a) {
				var b = arguments,
					c = a.guid || f.guid++,
					d = 0,
					e = function (c) {
						var e = (f._data(this, "lastToggle" + a.guid) || 0) % d;
						f._data(this, "lastToggle" + a.guid, e + 1), c.preventDefault();
						return b[e].apply(this, arguments) || !1
					};
				e.guid = c;
				while (d < b.length) {
					b[d++].guid = c
				}
				return this.click(e)
			},
			hover: function (a, b) {
				return this.mouseenter(a).mouseleave(b || a)
			}
		}), f.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "), function (a, b) {
			f.fn[b] = function (a, c) {
				c == null && (c = a, a = null);
				return arguments.length > 0 ? this.on(b, null, a, c) : this.trigger(b)
			}, f.attrFn && (f.attrFn[b] = !0), C.test(b) && (f.event.fixHooks[b] = f.event.keyHooks), D.test(b) && (f.event.fixHooks[b] = f.event.mouseHooks)
		}),
		function () {
			function x(a, b, c, e, f, g) {
				for (var h = 0, i = e.length; h < i; h++) {
					var j = e[h];
					if (j) {
						var k = !1;
						j = j[a];
						while (j) {
							if (j[d] === c) {
								k = e[j.sizset];
								break
							}
							if (j.nodeType === 1) {
								g || (j[d] = c, j.sizset = h);
								if (typeof b != "string") {
									if (j === b) {
										k = !0;
										break
									}
								} else {
									if (m.filter(b, [j]).length > 0) {
										k = j;
										break
									}
								}
							}
							j = j[a]
						}
						e[h] = k
					}
				}
			}

			function w(a, b, c, e, f, g) {
				for (var h = 0, i = e.length; h < i; h++) {
					var j = e[h];
					if (j) {
						var k = !1;
						j = j[a];
						while (j) {
							if (j[d] === c) {
								k = e[j.sizset];
								break
							}
							j.nodeType === 1 && !g && (j[d] = c, j.sizset = h);
							if (j.nodeName.toLowerCase() === b) {
								k = j;
								break
							}
							j = j[a]
						}
						e[h] = k
					}
				}
			}
			var a = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
				d = "sizcache" + (Math.random() + "").replace(".", ""),
				e = 0,
				g = Object.prototype.toString,
				h = !1,
				i = !0,
				j = /\\/g,
				k = /\r\n/g,
				l = /\W/;
			[0, 0].sort(function () {
				i = !1;
				return 0
			});
			var m = function (b, d, e, f) {
				e = e || [], d = d || c;
				var h = d;
				if (d.nodeType !== 1 && d.nodeType !== 9) {
					return []
				}
				if (!b || typeof b != "string") {
					return e
				}
				var i, j, k, l, n, q, r, t, u = !0,
					v = m.isXML(d),
					w = [],
					x = b;
				do {
					a.exec(""), i = a.exec(x);
					if (i) {
						x = i[3], w.push(i[1]);
						if (i[2]) {
							l = i[3];
							break
						}
					}
				} while (i);
				if (w.length > 1 && p.exec(b)) {
					if (w.length === 2 && o.relative[w[0]]) {
						j = y(w[0] + w[1], d, f)
					} else {
						j = o.relative[w[0]] ? [d] : m(w.shift(), d);
						while (w.length) {
							b = w.shift(), o.relative[b] && (b += w.shift()), j = y(b, j, f)
						}
					}
				} else {
					!f && w.length > 1 && d.nodeType === 9 && !v && o.match.ID.test(w[0]) && !o.match.ID.test(w[w.length - 1]) && (n = m.find(w.shift(), d, v), d = n.expr ? m.filter(n.expr, n.set)[0] : n.set[0]);
					if (d) {
						n = f ? {
							expr: w.pop(),
							set: s(f)
						} : m.find(w.pop(), w.length === 1 && (w[0] === "~" || w[0] === "+") && d.parentNode ? d.parentNode : d, v), j = n.expr ? m.filter(n.expr, n.set) : n.set, w.length > 0 ? k = s(j) : u = !1;
						while (w.length) {
							q = w.pop(), r = q, o.relative[q] ? r = w.pop() : q = "", r == null && (r = d), o.relative[q](k, r, v)
						}
					} else {
						k = w = []
					}
				}
				k || (k = j), k || m.error(q || b);
				if (g.call(k) === "[object Array]") {
					if (!u) {
						e.push.apply(e, k)
					} else {
						if (d && d.nodeType === 1) {
							for (t = 0; k[t] != null; t++) {
								k[t] && (k[t] === !0 || k[t].nodeType === 1 && m.contains(d, k[t])) && e.push(j[t])
							}
						} else {
							for (t = 0; k[t] != null; t++) {
								k[t] && k[t].nodeType === 1 && e.push(j[t])
							}
						}
					}
				} else {
					s(k, e)
				}
				l && (m(l, h, e, f), m.uniqueSort(e));
				return e
			};
			m.uniqueSort = function (a) {
				if (u) {
					h = i, a.sort(u);
					if (h) {
						for (var b = 1; b < a.length; b++) {
							a[b] === a[b - 1] && a.splice(b--, 1)
						}
					}
				}
				return a
			}, m.matches = function (a, b) {
				return m(a, null, null, b)
			}, m.matchesSelector = function (a, b) {
				return m(b, null, null, [a]).length > 0
			}, m.find = function (a, b, c) {
				var d, e, f, g, h, i;
				if (!a) {
					return []
				}
				for (e = 0, f = o.order.length; e < f; e++) {
					h = o.order[e];
					if (g = o.leftMatch[h].exec(a)) {
						i = g[1], g.splice(1, 1);
						if (i.substr(i.length - 1) !== "\\") {
							g[1] = (g[1] || "").replace(j, ""), d = o.find[h](g, b, c);
							if (d != null) {
								a = a.replace(o.match[h], "");
								break
							}
						}
					}
				}
				d || (d = typeof b.getElementsByTagName != "undefined" ? b.getElementsByTagName("*") : []);
				return {
					set: d,
					expr: a
				}
			}, m.filter = function (a, c, d, e) {
				var f, g, h, i, j, k, l, n, p, q = a,
					r = [],
					s = c,
					t = c && c[0] && m.isXML(c[0]);
				while (a && c.length) {
					for (h in o.filter) {
						if ((f = o.leftMatch[h].exec(a)) != null && f[2]) {
							k = o.filter[h], l = f[1], g = !1, f.splice(1, 1);
							if (l.substr(l.length - 1) === "\\") {
								continue
							}
							s === r && (r = []);
							if (o.preFilter[h]) {
								f = o.preFilter[h](f, s, d, r, e, t);
								if (!f) {
									g = i = !0
								} else {
									if (f === !0) {
										continue
									}
								}
							}
							if (f) {
								for (n = 0;
									(j = s[n]) != null; n++) {
									j && (i = k(j, f, n, s), p = e ^ i, d && i != null ? p ? g = !0 : s[n] = !1 : p && (r.push(j), g = !0))
								}
							}
							if (i !== b) {
								d || (s = r), a = a.replace(o.match[h], "");
								if (!g) {
									return []
								}
								break
							}
						}
					}
					if (a === q) {
						if (g == null) {
							m.error(a)
						} else {
							break
						}
					}
					q = a
				}
				return s
			}, m.error = function (a) {
				throw new Error("Syntax error, unrecognized expression: " + a)
			};
			var n = m.getText = function (a) {
					var b, c, d = a.nodeType,
						e = "";
					if (d) {
						if (d === 1 || d === 9 || d === 11) {
							if (typeof a.textContent == "string") {
								return a.textContent
							}
							if (typeof a.innerText == "string") {
								return a.innerText.replace(k, "")
							}
							for (a = a.firstChild; a; a = a.nextSibling) {
								e += n(a)
							}
						} else {
							if (d === 3 || d === 4) {
								return a.nodeValue
							}
						}
					} else {
						for (b = 0; c = a[b]; b++) {
							c.nodeType !== 8 && (e += n(c))
						}
					}
					return e
				},
				o = m.selectors = {
					order: ["ID", "NAME", "TAG"],
					match: {
						ID: /#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
						CLASS: /\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
						NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,
						ATTR: /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,
						TAG: /^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,
						CHILD: /:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,
						POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,
						PSEUDO: /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/
					},
					leftMatch: {},
					attrMap: {
						"class": "className",
						"for": "htmlFor"
					},
					attrHandle: {
						href: function (a) {
							return a.getAttribute("href")
						},
						type: function (a) {
							return a.getAttribute("type")
						}
					},
					relative: {
						"+": function (a, b) {
							var c = typeof b == "string",
								d = c && !l.test(b),
								e = c && !d;
							d && (b = b.toLowerCase());
							for (var f = 0, g = a.length, h; f < g; f++) {
								if (h = a[f]) {
									while ((h = h.previousSibling) && h.nodeType !== 1) {}
									a[f] = e || h && h.nodeName.toLowerCase() === b ? h || !1 : h === b
								}
							}
							e && m.filter(b, a, !0)
						},
						">": function (a, b) {
							var c, d = typeof b == "string",
								e = 0,
								f = a.length;
							if (d && !l.test(b)) {
								b = b.toLowerCase();
								for (; e < f; e++) {
									c = a[e];
									if (c) {
										var g = c.parentNode;
										a[e] = g.nodeName.toLowerCase() === b ? g : !1
									}
								}
							} else {
								for (; e < f; e++) {
									c = a[e], c && (a[e] = d ? c.parentNode : c.parentNode === b)
								}
								d && m.filter(b, a, !0)
							}
						},
						"": function (a, b, c) {
							var d, f = e++,
								g = x;
							typeof b == "string" && !l.test(b) && (b = b.toLowerCase(), d = b, g = w), g("parentNode", b, f, a, d, c)
						},
						"~": function (a, b, c) {
							var d, f = e++,
								g = x;
							typeof b == "string" && !l.test(b) && (b = b.toLowerCase(), d = b, g = w), g("previousSibling", b, f, a, d, c)
						}
					},
					find: {
						ID: function (a, b, c) {
							if (typeof b.getElementById != "undefined" && !c) {
								var d = b.getElementById(a[1]);
								return d && d.parentNode ? [d] : []
							}
						},
						NAME: function (a, b) {
							if (typeof b.getElementsByName != "undefined") {
								var c = [],
									d = b.getElementsByName(a[1]);
								for (var e = 0, f = d.length; e < f; e++) {
									d[e].getAttribute("name") === a[1] && c.push(d[e])
								}
								return c.length === 0 ? null : c
							}
						},
						TAG: function (a, b) {
							if (typeof b.getElementsByTagName != "undefined") {
								return b.getElementsByTagName(a[1])
							}
						}
					},
					preFilter: {
						CLASS: function (a, b, c, d, e, f) {
							a = " " + a[1].replace(j, "") + " ";
							if (f) {
								return a
							}
							for (var g = 0, h;
								(h = b[g]) != null; g++) {
								h && (e ^ (h.className && (" " + h.className + " ").replace(/[\t\n\r]/g, " ").indexOf(a) >= 0) ? c || d.push(h) : c && (b[g] = !1))
							}
							return !1
						},
						ID: function (a) {
							return a[1].replace(j, "")
						},
						TAG: function (a, b) {
							return a[1].replace(j, "").toLowerCase()
						},
						CHILD: function (a) {
							if (a[1] === "nth") {
								a[2] || m.error(a[0]), a[2] = a[2].replace(/^\+|\s*/g, "");
								var b = /(-?)(\d*)(?:n([+\-]?\d*))?/.exec(a[2] === "even" && "2n" || a[2] === "odd" && "2n+1" || !/\D/.test(a[2]) && "0n+" + a[2] || a[2]);
								a[2] = b[1] + (b[2] || 1) - 0, a[3] = b[3] - 0
							} else {
								a[2] && m.error(a[0])
							}
							a[0] = e++;
							return a
						},
						ATTR: function (a, b, c, d, e, f) {
							var g = a[1] = a[1].replace(j, "");
							!f && o.attrMap[g] && (a[1] = o.attrMap[g]), a[4] = (a[4] || a[5] || "").replace(j, ""), a[2] === "~=" && (a[4] = " " + a[4] + " ");
							return a
						},
						PSEUDO: function (b, c, d, e, f) {
							if (b[1] === "not") {
								if ((a.exec(b[3]) || "").length > 1 || /^\w/.test(b[3])) {
									b[3] = m(b[3], null, null, c)
								} else {
									var g = m.filter(b[3], c, d, !0 ^ f);
									d || e.push.apply(e, g);
									return !1
								}
							} else {
								if (o.match.POS.test(b[0]) || o.match.CHILD.test(b[0])) {
									return !0
								}
							}
							return b
						},
						POS: function (a) {
							a.unshift(!0);
							return a
						}
					},
					filters: {
						enabled: function (a) {
							return a.disabled === !1 && a.type !== "hidden"
						},
						disabled: function (a) {
							return a.disabled === !0
						},
						checked: function (a) {
							return a.checked === !0
						},
						selected: function (a) {
							a.parentNode && a.parentNode.selectedIndex;
							return a.selected === !0
						},
						parent: function (a) {
							return !!a.firstChild
						},
						empty: function (a) {
							return !a.firstChild
						},
						has: function (a, b, c) {
							return !!m(c[3], a).length
						},
						header: function (a) {
							return /h\d/i.test(a.nodeName)
						},
						text: function (a) {
							var b = a.getAttribute("type"),
								c = a.type;
							return a.nodeName.toLowerCase() === "input" && "text" === c && (b === c || b === null)
						},
						radio: function (a) {
							return a.nodeName.toLowerCase() === "input" && "radio" === a.type
						},
						checkbox: function (a) {
							return a.nodeName.toLowerCase() === "input" && "checkbox" === a.type
						},
						file: function (a) {
							return a.nodeName.toLowerCase() === "input" && "file" === a.type
						},
						password: function (a) {
							return a.nodeName.toLowerCase() === "input" && "password" === a.type
						},
						submit: function (a) {
							var b = a.nodeName.toLowerCase();
							return (b === "input" || b === "button") && "submit" === a.type
						},
						image: function (a) {
							return a.nodeName.toLowerCase() === "input" && "image" === a.type
						},
						reset: function (a) {
							var b = a.nodeName.toLowerCase();
							return (b === "input" || b === "button") && "reset" === a.type
						},
						button: function (a) {
							var b = a.nodeName.toLowerCase();
							return b === "input" && "button" === a.type || b === "button"
						},
						input: function (a) {
							return /input|select|textarea|button/i.test(a.nodeName)
						},
						focus: function (a) {
							return a === a.ownerDocument.activeElement
						}
					},
					setFilters: {
						first: function (a, b) {
							return b === 0
						},
						last: function (a, b, c, d) {
							return b === d.length - 1
						},
						even: function (a, b) {
							return b % 2 === 0
						},
						odd: function (a, b) {
							return b % 2 === 1
						},
						lt: function (a, b, c) {
							return b < c[3] - 0
						},
						gt: function (a, b, c) {
							return b > c[3] - 0
						},
						nth: function (a, b, c) {
							return c[3] - 0 === b
						},
						eq: function (a, b, c) {
							return c[3] - 0 === b
						}
					},
					filter: {
						PSEUDO: function (a, b, c, d) {
							var e = b[1],
								f = o.filters[e];
							if (f) {
								return f(a, c, b, d)
							}
							if (e === "contains") {
								return (a.textContent || a.innerText || n([a]) || "").indexOf(b[3]) >= 0
							}
							if (e === "not") {
								var g = b[3];
								for (var h = 0, i = g.length; h < i; h++) {
									if (g[h] === a) {
										return !1
									}
								}
								return !0
							}
							m.error(e)
						},
						CHILD: function (a, b) {
							var c, e, f, g, h, i, j, k = b[1],
								l = a;
							switch (k) {
								case "only":
								case "first":
									while (l = l.previousSibling) {
										if (l.nodeType === 1) {
											return !1
										}
									}
									if (k === "first") {
										return !0
									}
									l = a;
								case "last":
									while (l = l.nextSibling) {
										if (l.nodeType === 1) {
											return !1
										}
									}
									return !0;
								case "nth":
									c = b[2], e = b[3];
									if (c === 1 && e === 0) {
										return !0
									}
									f = b[0], g = a.parentNode;
									if (g && (g[d] !== f || !a.nodeIndex)) {
										i = 0;
										for (l = g.firstChild; l; l = l.nextSibling) {
											l.nodeType === 1 && (l.nodeIndex = ++i)
										}
										g[d] = f
									}
									j = a.nodeIndex - e;
									return c === 0 ? j === 0 : j % c === 0 && j / c >= 0
							}
						},
						ID: function (a, b) {
							return a.nodeType === 1 && a.getAttribute("id") === b
						},
						TAG: function (a, b) {
							return b === "*" && a.nodeType === 1 || !!a.nodeName && a.nodeName.toLowerCase() === b
						},
						CLASS: function (a, b) {
							return (" " + (a.className || a.getAttribute("class")) + " ").indexOf(b) > -1
						},
						ATTR: function (a, b) {
							var c = b[1],
								d = m.attr ? m.attr(a, c) : o.attrHandle[c] ? o.attrHandle[c](a) : a[c] != null ? a[c] : a.getAttribute(c),
								e = d + "",
								f = b[2],
								g = b[4];
							return d == null ? f === "!=" : !f && m.attr ? d != null : f === "=" ? e === g : f === "*=" ? e.indexOf(g) >= 0 : f === "~=" ? (" " + e + " ").indexOf(g) >= 0 : g ? f === "!=" ? e !== g : f === "^=" ? e.indexOf(g) === 0 : f === "$=" ? e.substr(e.length - g.length) === g : f === "|=" ? e === g || e.substr(0, g.length + 1) === g + "-" : !1 : e && d !== !1
						},
						POS: function (a, b, c, d) {
							var e = b[2],
								f = o.setFilters[e];
							if (f) {
								return f(a, c, b, d)
							}
						}
					}
				},
				p = o.match.POS,
				q = function (a, b) {
					return "\\" + (b - 0 + 1)
				};
			for (var r in o.match) {
				o.match[r] = new RegExp(o.match[r].source + /(?![^\[]*\])(?![^\(]*\))/.source), o.leftMatch[r] = new RegExp(/(^(?:.|\r|\n)*?)/.source + o.match[r].source.replace(/\\(\d+)/g, q))
			}
			o.match.globalPOS = p;
			var s = function (a, b) {
				a = Array.prototype.slice.call(a, 0);
				if (b) {
					b.push.apply(b, a);
					return b
				}
				return a
			};
			try {
				Array.prototype.slice.call(c.documentElement.childNodes, 0)[0].nodeType
			} catch (t) {
				s = function (a, b) {
					var c = 0,
						d = b || [];
					if (g.call(a) === "[object Array]") {
						Array.prototype.push.apply(d, a)
					} else {
						if (typeof a.length == "number") {
							for (var e = a.length; c < e; c++) {
								d.push(a[c])
							}
						} else {
							for (; a[c]; c++) {
								d.push(a[c])
							}
						}
					}
					return d
				}
			}
			var u, v;
			c.documentElement.compareDocumentPosition ? u = function (a, b) {
					if (a === b) {
						h = !0;
						return 0
					}
					if (!a.compareDocumentPosition || !b.compareDocumentPosition) {
						return a.compareDocumentPosition ? -1 : 1
					}
					return a.compareDocumentPosition(b) & 4 ? -1 : 1
				} : (u = function (a, b) {
					if (a === b) {
						h = !0;
						return 0
					}
					if (a.sourceIndex && b.sourceIndex) {
						return a.sourceIndex - b.sourceIndex
					}
					var c, d, e = [],
						f = [],
						g = a.parentNode,
						i = b.parentNode,
						j = g;
					if (g === i) {
						return v(a, b)
					}
					if (!g) {
						return -1
					}
					if (!i) {
						return 1
					}
					while (j) {
						e.unshift(j), j = j.parentNode
					}
					j = i;
					while (j) {
						f.unshift(j), j = j.parentNode
					}
					c = e.length, d = f.length;
					for (var k = 0; k < c && k < d; k++) {
						if (e[k] !== f[k]) {
							return v(e[k], f[k])
						}
					}
					return k === c ? v(a, f[k], -1) : v(e[k], b, 1)
				}, v = function (a, b, c) {
					if (a === b) {
						return c
					}
					var d = a.nextSibling;
					while (d) {
						if (d === b) {
							return -1
						}
						d = d.nextSibling
					}
					return 1
				}),
				function () {
					var a = c.createElement("div"),
						d = "script" + (new Date).getTime(),
						e = c.documentElement;
					a.innerHTML = "<a name='" + d + "'/>", e.insertBefore(a, e.firstChild), c.getElementById(d) && (o.find.ID = function (a, c, d) {
						if (typeof c.getElementById != "undefined" && !d) {
							var e = c.getElementById(a[1]);
							return e ? e.id === a[1] || typeof e.getAttributeNode != "undefined" && e.getAttributeNode("id").nodeValue === a[1] ? [e] : b : []
						}
					}, o.filter.ID = function (a, b) {
						var c = typeof a.getAttributeNode != "undefined" && a.getAttributeNode("id");
						return a.nodeType === 1 && c && c.nodeValue === b
					}), e.removeChild(a), e = a = null
				}(),
				function () {
					var a = c.createElement("div");
					a.appendChild(c.createComment("")), a.getElementsByTagName("*").length > 0 && (o.find.TAG = function (a, b) {
						var c = b.getElementsByTagName(a[1]);
						if (a[1] === "*") {
							var d = [];
							for (var e = 0; c[e]; e++) {
								c[e].nodeType === 1 && d.push(c[e])
							}
							c = d
						}
						return c
					}), a.innerHTML = "<a href='#'></a>", a.firstChild && typeof a.firstChild.getAttribute != "undefined" && a.firstChild.getAttribute("href") !== "#" && (o.attrHandle.href = function (a) {
						return a.getAttribute("href", 2)
					}), a = null
				}(), c.querySelectorAll && function () {
					var a = m,
						b = c.createElement("div"),
						d = "__sizzle__";
					b.innerHTML = "<p class='TEST'></p>";
					if (!b.querySelectorAll || b.querySelectorAll(".TEST").length !== 0) {
						m = function (b, e, f, g) {
							e = e || c;
							if (!g && !m.isXML(e)) {
								var h = /^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec(b);
								if (h && (e.nodeType === 1 || e.nodeType === 9)) {
									if (h[1]) {
										return s(e.getElementsByTagName(b), f)
									}
									if (h[2] && o.find.CLASS && e.getElementsByClassName) {
										return s(e.getElementsByClassName(h[2]), f)
									}
								}
								if (e.nodeType === 9) {
									if (b === "body" && e.body) {
										return s([e.body], f)
									}
									if (h && h[3]) {
										var i = e.getElementById(h[3]);
										if (!i || !i.parentNode) {
											return s([], f)
										}
										if (i.id === h[3]) {
											return s([i], f)
										}
									}
									try {
										return s(e.querySelectorAll(b), f)
									} catch (j) {}
								} else {
									if (e.nodeType === 1 && e.nodeName.toLowerCase() !== "object") {
										var k = e,
											l = e.getAttribute("id"),
											n = l || d,
											p = e.parentNode,
											q = /^\s*[+~]/.test(b);
										l ? n = n.replace(/'/g, "\\$&") : e.setAttribute("id", n), q && p && (e = e.parentNode);
										try {
											if (!q || p) {
												return s(e.querySelectorAll("[id='" + n + "'] " + b), f)
											}
										} catch (r) {} finally {
											l || k.removeAttribute("id")
										}
									}
								}
							}
							return a(b, e, f, g)
						};
						for (var e in a) {
							m[e] = a[e]
						}
						b = null
					}
				}(),
				function () {
					var a = c.documentElement,
						b = a.matchesSelector || a.mozMatchesSelector || a.webkitMatchesSelector || a.msMatchesSelector;
					if (b) {
						var d = !b.call(c.createElement("div"), "div"),
							e = !1;
						try {
							b.call(c.documentElement, "[test!='']:sizzle")
						} catch (f) {
							e = !0
						}
						m.matchesSelector = function (a, c) {
							c = c.replace(/\=\s*([^'"\]]*)\s*\]/g, "='$1']");
							if (!m.isXML(a)) {
								try {
									if (e || !o.match.PSEUDO.test(c) && !/!=/.test(c)) {
										var f = b.call(a, c);
										if (f || !d || a.document && a.document.nodeType !== 11) {
											return f
										}
									}
								} catch (g) {}
							}
							return m(c, null, null, [a]).length > 0
						}
					}
				}(),
				function () {
					var a = c.createElement("div");
					a.innerHTML = "<div class='test e'></div><div class='test'></div>";
					if (!!a.getElementsByClassName && a.getElementsByClassName("e").length !== 0) {
						a.lastChild.className = "e";
						if (a.getElementsByClassName("e").length === 1) {
							return
						}
						o.order.splice(1, 0, "CLASS"), o.find.CLASS = function (a, b, c) {
							if (typeof b.getElementsByClassName != "undefined" && !c) {
								return b.getElementsByClassName(a[1])
							}
						}, a = null
					}
				}(), c.documentElement.contains ? m.contains = function (a, b) {
					return a !== b && (a.contains ? a.contains(b) : !0)
				} : c.documentElement.compareDocumentPosition ? m.contains = function (a, b) {
					return !!(a.compareDocumentPosition(b) & 16)
				} : m.contains = function () {
					return !1
				}, m.isXML = function (a) {
					var b = (a ? a.ownerDocument || a : 0).documentElement;
					return b ? b.nodeName !== "HTML" : !1
				};
			var y = function (a, b, c) {
				var d, e = [],
					f = "",
					g = b.nodeType ? [b] : b;
				while (d = o.match.PSEUDO.exec(a)) {
					f += d[0], a = a.replace(o.match.PSEUDO, "")
				}
				a = o.relative[a] ? a + "*" : a;
				for (var h = 0, i = g.length; h < i; h++) {
					m(a, g[h], e, c)
				}
				return m.filter(f, e)
			};
			m.attr = f.attr, m.selectors.attrMap = {}, f.find = m, f.expr = m.selectors, f.expr[":"] = f.expr.filters, f.unique = m.uniqueSort, f.text = m.getText, f.isXMLDoc = m.isXML, f.contains = m.contains
		}();
	var L = /Until$/,
		M = /^(?:parents|prevUntil|prevAll)/,
		N = /,/,
		O = /^.[^:#\[\.,]*$/,
		P = Array.prototype.slice,
		Q = f.expr.match.globalPOS,
		R = {
			children: !0,
			contents: !0,
			next: !0,
			prev: !0
		};
	f.fn.extend({
		find: function (a) {
			var b = this,
				c, d;
			if (typeof a != "string") {
				return f(a).filter(function () {
					for (c = 0, d = b.length; c < d; c++) {
						if (f.contains(b[c], this)) {
							return !0
						}
					}
				})
			}
			var e = this.pushStack("", "find", a),
				g, h, i;
			for (c = 0, d = this.length; c < d; c++) {
				g = e.length, f.find(a, this[c], e);
				if (c > 0) {
					for (h = g; h < e.length; h++) {
						for (i = 0; i < g; i++) {
							if (e[i] === e[h]) {
								e.splice(h--, 1);
								break
							}
						}
					}
				}
			}
			return e
		},
		has: function (a) {
			var b = f(a);
			return this.filter(function () {
				for (var a = 0, c = b.length; a < c; a++) {
					if (f.contains(this, b[a])) {
						return !0
					}
				}
			})
		},
		not: function (a) {
			return this.pushStack(T(this, a, !1), "not", a)
		},
		filter: function (a) {
			return this.pushStack(T(this, a, !0), "filter", a)
		},
		is: function (a) {
			return !!a && (typeof a == "string" ? Q.test(a) ? f(a, this.context).index(this[0]) >= 0 : f.filter(a, this).length > 0 : this.filter(a).length > 0)
		},
		closest: function (a, b) {
			var c = [],
				d, e, g = this[0];
			if (f.isArray(a)) {
				var h = 1;
				while (g && g.ownerDocument && g !== b) {
					for (d = 0; d < a.length; d++) {
						f(g).is(a[d]) && c.push({
							selector: a[d],
							elem: g,
							level: h
						})
					}
					g = g.parentNode, h++
				}
				return c
			}
			var i = Q.test(a) || typeof a != "string" ? f(a, b || this.context) : 0;
			for (d = 0, e = this.length; d < e; d++) {
				g = this[d];
				while (g) {
					if (i ? i.index(g) > -1 : f.find.matchesSelector(g, a)) {
						c.push(g);
						break
					}
					g = g.parentNode;
					if (!g || !g.ownerDocument || g === b || g.nodeType === 11) {
						break
					}
				}
			}
			c = c.length > 1 ? f.unique(c) : c;
			return this.pushStack(c, "closest", a)
		},
		index: function (a) {
			if (!a) {
				return this[0] && this[0].parentNode ? this.prevAll().length : -1
			}
			if (typeof a == "string") {
				return f.inArray(this[0], f(a))
			}
			return f.inArray(a.jquery ? a[0] : a, this)
		},
		add: function (a, b) {
			var c = typeof a == "string" ? f(a, b) : f.makeArray(a && a.nodeType ? [a] : a),
				d = f.merge(this.get(), c);
			return this.pushStack(S(c[0]) || S(d[0]) ? d : f.unique(d))
		},
		andSelf: function () {
			return this.add(this.prevObject)
		}
	}), f.each({
		parent: function (a) {
			var b = a.parentNode;
			return b && b.nodeType !== 11 ? b : null
		},
		parents: function (a) {
			return f.dir(a, "parentNode")
		},
		parentsUntil: function (a, b, c) {
			return f.dir(a, "parentNode", c)
		},
		next: function (a) {
			return f.nth(a, 2, "nextSibling")
		},
		prev: function (a) {
			return f.nth(a, 2, "previousSibling")
		},
		nextAll: function (a) {
			return f.dir(a, "nextSibling")
		},
		prevAll: function (a) {
			return f.dir(a, "previousSibling")
		},
		nextUntil: function (a, b, c) {
			return f.dir(a, "nextSibling", c)
		},
		prevUntil: function (a, b, c) {
			return f.dir(a, "previousSibling", c)
		},
		siblings: function (a) {
			return f.sibling((a.parentNode || {}).firstChild, a)
		},
		children: function (a) {
			return f.sibling(a.firstChild)
		},
		contents: function (a) {
			return f.nodeName(a, "iframe") ? a.contentDocument || a.contentWindow.document : f.makeArray(a.childNodes)
		}
	}, function (a, b) {
		f.fn[a] = function (c, d) {
			var e = f.map(this, b, c);
			L.test(a) || (d = c), d && typeof d == "string" && (e = f.filter(d, e)), e = this.length > 1 && !R[a] ? f.unique(e) : e, (this.length > 1 || N.test(d)) && M.test(a) && (e = e.reverse());
			return this.pushStack(e, a, P.call(arguments).join(","))
		}
	}), f.extend({
		filter: function (a, b, c) {
			c && (a = ":not(" + a + ")");
			return b.length === 1 ? f.find.matchesSelector(b[0], a) ? [b[0]] : [] : f.find.matches(a, b)
		},
		dir: function (a, c, d) {
			var e = [],
				g = a[c];
			while (g && g.nodeType !== 9 && (d === b || g.nodeType !== 1 || !f(g).is(d))) {
				g.nodeType === 1 && e.push(g), g = g[c]
			}
			return e
		},
		nth: function (a, b, c, d) {
			b = b || 1;
			var e = 0;
			for (; a; a = a[c]) {
				if (a.nodeType === 1 && ++e === b) {
					break
				}
			}
			return a
		},
		sibling: function (a, b) {
			var c = [];
			for (; a; a = a.nextSibling) {
				a.nodeType === 1 && a !== b && c.push(a)
			}
			return c
		}
	});
	var V = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
		W = / jQuery\d+="(?:\d+|null)"/g,
		X = /^\s+/,
		Y = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
		Z = /<([\w:]+)/,
		$ = /<tbody/i,
		_ = /<|&#?\w+;/,
		ba = /<(?:script|style)/i,
		bb = /<(?:script|object|embed|option|style)/i,
		bc = new RegExp("<(?:" + V + ")[\\s/>]", "i"),
		bd = /checked\s*(?:[^=]|=\s*.checked.)/i,
		be = /\/(java|ecma)script/i,
		bf = /^\s*<!(?:\[CDATA\[|\-\-)/,
		bg = {
			option: [1, "<select multiple='multiple'>", "</select>"],
			legend: [1, "<fieldset>", "</fieldset>"],
			thead: [1, "<table>", "</table>"],
			tr: [2, "<table><tbody>", "</tbody></table>"],
			td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
			col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"],
			area: [1, "<map>", "</map>"],
			_default: [0, "", ""]
		},
		bh = U(c);
	bg.optgroup = bg.option, bg.tbody = bg.tfoot = bg.colgroup = bg.caption = bg.thead, bg.th = bg.td, f.support.htmlSerialize || (bg._default = [1, "div<div>", "</div>"]), f.fn.extend({
		text: function (a) {
			return f.access(this, function (a) {
				return a === b ? f.text(this) : this.empty().append((this[0] && this[0].ownerDocument || c).createTextNode(a))
			}, null, a, arguments.length)
		},
		wrapAll: function (a) {
			if (f.isFunction(a)) {
				return this.each(function (b) {
					f(this).wrapAll(a.call(this, b))
				})
			}
			if (this[0]) {
				var b = f(a, this[0].ownerDocument).eq(0).clone(!0);
				this[0].parentNode && b.insertBefore(this[0]), b.map(function () {
					var a = this;
					while (a.firstChild && a.firstChild.nodeType === 1) {
						a = a.firstChild
					}
					return a
				}).append(this)
			}
			return this
		},
		wrapInner: function (a) {
			if (f.isFunction(a)) {
				return this.each(function (b) {
					f(this).wrapInner(a.call(this, b))
				})
			}
			return this.each(function () {
				var b = f(this),
					c = b.contents();
				c.length ? c.wrapAll(a) : b.append(a)
			})
		},
		wrap: function (a) {
			var b = f.isFunction(a);
			return this.each(function (c) {
				f(this).wrapAll(b ? a.call(this, c) : a)
			})
		},
		unwrap: function () {
			return this.parent().each(function () {
				f.nodeName(this, "body") || f(this).replaceWith(this.childNodes)
			}).end()
		},
		append: function () {
			return this.domManip(arguments, !0, function (a) {
				this.nodeType === 1 && this.appendChild(a)
			})
		},
		prepend: function () {
			return this.domManip(arguments, !0, function (a) {
				this.nodeType === 1 && this.insertBefore(a, this.firstChild)
			})
		},
		before: function () {
			if (this[0] && this[0].parentNode) {
				return this.domManip(arguments, !1, function (a) {
					this.parentNode.insertBefore(a, this)
				})
			}
			if (arguments.length) {
				var a = f.clean(arguments);
				a.push.apply(a, this.toArray());
				return this.pushStack(a, "before", arguments)
			}
		},
		after: function () {
			if (this[0] && this[0].parentNode) {
				return this.domManip(arguments, !1, function (a) {
					this.parentNode.insertBefore(a, this.nextSibling)
				})
			}
			if (arguments.length) {
				var a = this.pushStack(this, "after", arguments);
				a.push.apply(a, f.clean(arguments));
				return a
			}
		},
		remove: function (a, b) {
			for (var c = 0, d;
				(d = this[c]) != null; c++) {
				if (!a || f.filter(a, [d]).length) {
					!b && d.nodeType === 1 && (f.cleanData(d.getElementsByTagName("*")), f.cleanData([d])), d.parentNode && d.parentNode.removeChild(d)
				}
			}
			return this
		},
		empty: function () {
			for (var a = 0, b;
				(b = this[a]) != null; a++) {
				b.nodeType === 1 && f.cleanData(b.getElementsByTagName("*"));
				while (b.firstChild) {
					b.removeChild(b.firstChild)
				}
			}
			return this
		},
		clone: function (a, b) {
			a = a == null ? !1 : a, b = b == null ? a : b;
			return this.map(function () {
				return f.clone(this, a, b)
			})
		},
		html: function (a) {
			return f.access(this, function (a) {
				var c = this[0] || {},
					d = 0,
					e = this.length;
				if (a === b) {
					return c.nodeType === 1 ? c.innerHTML.replace(W, "") : null
				}
				if (typeof a == "string" && !ba.test(a) && (f.support.leadingWhitespace || !X.test(a)) && !bg[(Z.exec(a) || ["", ""])[1].toLowerCase()]) {
					a = a.replace(Y, "<$1></$2>");
					try {
						for (; d < e; d++) {
							c = this[d] || {}, c.nodeType === 1 && (f.cleanData(c.getElementsByTagName("*")), c.innerHTML = a)
						}
						c = 0
					} catch (g) {}
				}
				c && this.empty().append(a)
			}, null, a, arguments.length)
		},
		replaceWith: function (a) {
			if (this[0] && this[0].parentNode) {
				if (f.isFunction(a)) {
					return this.each(function (b) {
						var c = f(this),
							d = c.html();
						c.replaceWith(a.call(this, b, d))
					})
				}
				typeof a != "string" && (a = f(a).detach());
				return this.each(function () {
					var b = this.nextSibling,
						c = this.parentNode;
					f(this).remove(), b ? f(b).before(a) : f(c).append(a)
				})
			}
			return this.length ? this.pushStack(f(f.isFunction(a) ? a() : a), "replaceWith", a) : this
		},
		detach: function (a) {
			return this.remove(a, !0)
		},
		domManip: function (a, c, d) {
			var e, g, h, i, j = a[0],
				k = [];
			if (!f.support.checkClone && arguments.length === 3 && typeof j == "string" && bd.test(j)) {
				return this.each(function () {
					f(this).domManip(a, c, d, !0)
				})
			}
			if (f.isFunction(j)) {
				return this.each(function (e) {
					var g = f(this);
					a[0] = j.call(this, e, c ? g.html() : b), g.domManip(a, c, d)
				})
			}
			if (this[0]) {
				i = j && j.parentNode, f.support.parentNode && i && i.nodeType === 11 && i.childNodes.length === this.length ? e = {
					fragment: i
				} : e = f.buildFragment(a, this, k), h = e.fragment, h.childNodes.length === 1 ? g = h = h.firstChild : g = h.firstChild;
				if (g) {
					c = c && f.nodeName(g, "tr");
					for (var l = 0, m = this.length, n = m - 1; l < m; l++) {
						d.call(c ? bi(this[l], g) : this[l], e.cacheable || m > 1 && l < n ? f.clone(h, !0, !0) : h)
					}
				}
				k.length && f.each(k, function (a, b) {
					b.src ? f.ajax({
						type: "GET",
						global: !1,
						url: b.src,
						async: !1,
						dataType: "script"
					}) : f.globalEval((b.text || b.textContent || b.innerHTML || "").replace(bf, "/*$0*/")), b.parentNode && b.parentNode.removeChild(b)
				})
			}
			return this
		}
	}), f.buildFragment = function (a, b, d) {
		var e, g, h, i, j = a[0];
		b && b[0] && (i = b[0].ownerDocument || b[0]), i.createDocumentFragment || (i = c), a.length === 1 && typeof j == "string" && j.length < 512 && i === c && j.charAt(0) === "<" && !bb.test(j) && (f.support.checkClone || !bd.test(j)) && (f.support.html5Clone || !bc.test(j)) && (g = !0, h = f.fragments[j], h && h !== 1 && (e = h)), e || (e = i.createDocumentFragment(), f.clean(a, i, e, d)), g && (f.fragments[j] = h ? e : 1);
		return {
			fragment: e,
			cacheable: g
		}
	}, f.fragments = {}, f.each({
		appendTo: "append",
		prependTo: "prepend",
		insertBefore: "before",
		insertAfter: "after",
		replaceAll: "replaceWith"
	}, function (a, b) {
		f.fn[a] = function (c) {
			var d = [],
				e = f(c),
				g = this.length === 1 && this[0].parentNode;
			if (g && g.nodeType === 11 && g.childNodes.length === 1 && e.length === 1) {
				e[b](this[0]);
				return this
			}
			for (var h = 0, i = e.length; h < i; h++) {
				var j = (h > 0 ? this.clone(!0) : this).get();
				f(e[h])[b](j), d = d.concat(j)
			}
			return this.pushStack(d, a, e.selector)
		}
	}), f.extend({
		clone: function (a, b, c) {
			var d, e, g, h = f.support.html5Clone || f.isXMLDoc(a) || !bc.test("<" + a.nodeName + ">") ? a.cloneNode(!0) : bo(a);
			if ((!f.support.noCloneEvent || !f.support.noCloneChecked) && (a.nodeType === 1 || a.nodeType === 11) && !f.isXMLDoc(a)) {
				bk(a, h), d = bl(a), e = bl(h);
				for (g = 0; d[g]; ++g) {
					e[g] && bk(d[g], e[g])
				}
			}
			if (b) {
				bj(a, h);
				if (c) {
					d = bl(a), e = bl(h);
					for (g = 0; d[g]; ++g) {
						bj(d[g], e[g])
					}
				}
			}
			d = e = null;
			return h
		},
		clean: function (a, b, d, e) {
			var g, h, i, j = [];
			b = b || c, typeof b.createElement == "undefined" && (b = b.ownerDocument || b[0] && b[0].ownerDocument || c);
			for (var k = 0, l;
				(l = a[k]) != null; k++) {
				typeof l == "number" && (l += "");
				if (!l) {
					continue
				}
				if (typeof l == "string") {
					if (!_.test(l)) {
						l = b.createTextNode(l)
					} else {
						l = l.replace(Y, "<$1></$2>");
						var m = (Z.exec(l) || ["", ""])[1].toLowerCase(),
							n = bg[m] || bg._default,
							o = n[0],
							p = b.createElement("div"),
							q = bh.childNodes,
							r;
						b === c ? bh.appendChild(p) : U(b).appendChild(p), p.innerHTML = n[1] + l + n[2];
						while (o--) {
							p = p.lastChild
						}
						if (!f.support.tbody) {
							var s = $.test(l),
								t = m === "table" && !s ? p.firstChild && p.firstChild.childNodes : n[1] === "<table>" && !s ? p.childNodes : [];
							for (i = t.length - 1; i >= 0; --i) {
								f.nodeName(t[i], "tbody") && !t[i].childNodes.length && t[i].parentNode.removeChild(t[i])
							}
						}!f.support.leadingWhitespace && X.test(l) && p.insertBefore(b.createTextNode(X.exec(l)[0]), p.firstChild), l = p.childNodes, p && (p.parentNode.removeChild(p), q.length > 0 && (r = q[q.length - 1], r && r.parentNode && r.parentNode.removeChild(r)))
					}
				}
				var u;
				if (!f.support.appendChecked) {
					if (l[0] && typeof (u = l.length) == "number") {
						for (i = 0; i < u; i++) {
							bn(l[i])
						}
					} else {
						bn(l)
					}
				}
				l.nodeType ? j.push(l) : j = f.merge(j, l)
			}
			if (d) {
				g = function (a) {
					return !a.type || be.test(a.type)
				};
				for (k = 0; j[k]; k++) {
					h = j[k];
					if (e && f.nodeName(h, "script") && (!h.type || be.test(h.type))) {
						e.push(h.parentNode ? h.parentNode.removeChild(h) : h)
					} else {
						if (h.nodeType === 1) {
							var v = f.grep(h.getElementsByTagName("script"), g);
							j.splice.apply(j, [k + 1, 0].concat(v))
						}
						d.appendChild(h)
					}
				}
			}
			return j
		},
		cleanData: function (a) {
			var b, c, d = f.cache,
				e = f.event.special,
				g = f.support.deleteExpando;
			for (var h = 0, i;
				(i = a[h]) != null; h++) {
				if (i.nodeName && f.noData[i.nodeName.toLowerCase()]) {
					continue
				}
				c = i[f.expando];
				if (c) {
					b = d[c];
					if (b && b.events) {
						for (var j in b.events) {
							e[j] ? f.event.remove(i, j) : f.removeEvent(i, j, b.handle)
						}
						b.handle && (b.handle.elem = null)
					}
					g ? delete i[f.expando] : i.removeAttribute && i.removeAttribute(f.expando), delete d[c]
				}
			}
		}
	});
	var bp = /alpha\([^)]*\)/i,
		bq = /opacity=([^)]*)/,
		br = /([A-Z]|^ms)/g,
		bs = /^[\-+]?(?:\d*\.)?\d+$/i,
		bt = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i,
		bu = /^([\-+])=([\-+.\de]+)/,
		bv = /^margin/,
		bw = {
			position: "absolute",
			visibility: "hidden",
			display: "block"
		},
		bx = ["Top", "Right", "Bottom", "Left"],
		by, bz, bA;
	f.fn.css = function (a, c) {
		return f.access(this, function (a, c, d) {
			return d !== b ? f.style(a, c, d) : f.css(a, c)
		}, a, c, arguments.length > 1)
	}, f.extend({
		cssHooks: {
			opacity: {
				get: function (a, b) {
					if (b) {
						var c = by(a, "opacity");
						return c === "" ? "1" : c
					}
					return a.style.opacity
				}
			}
		},
		cssNumber: {
			fillOpacity: !0,
			fontWeight: !0,
			lineHeight: !0,
			opacity: !0,
			orphans: !0,
			widows: !0,
			zIndex: !0,
			zoom: !0
		},
		cssProps: {
			"float": f.support.cssFloat ? "cssFloat" : "styleFloat"
		},
		style: function (a, c, d, e) {
			if (!!a && a.nodeType !== 3 && a.nodeType !== 8 && !!a.style) {
				var g, h, i = f.camelCase(c),
					j = a.style,
					k = f.cssHooks[i];
				c = f.cssProps[i] || i;
				if (d === b) {
					if (k && "get" in k && (g = k.get(a, !1, e)) !== b) {
						return g
					}
					return j[c]
				}
				h = typeof d, h === "string" && (g = bu.exec(d)) && (d = +(g[1] + 1) * +g[2] + parseFloat(f.css(a, c)), h = "number");
				if (d == null || h === "number" && isNaN(d)) {
					return
				}
				h === "number" && !f.cssNumber[i] && (d += "px");
				if (!k || !("set" in k) || (d = k.set(a, d)) !== b) {
					try {
						j[c] = d
					} catch (l) {}
				}
			}
		},
		css: function (a, c, d) {
			var e, g;
			c = f.camelCase(c), g = f.cssHooks[c], c = f.cssProps[c] || c, c === "cssFloat" && (c = "float");
			if (g && "get" in g && (e = g.get(a, !0, d)) !== b) {
				return e
			}
			if (by) {
				return by(a, c)
			}
		},
		swap: function (a, b, c) {
			var d = {},
				e, f;
			for (f in b) {
				d[f] = a.style[f], a.style[f] = b[f]
			}
			e = c.call(a);
			for (f in b) {
				a.style[f] = d[f]
			}
			return e
		}
	}), f.curCSS = f.css, c.defaultView && c.defaultView.getComputedStyle && (bz = function (a, b) {
		var c, d, e, g, h = a.style;
		b = b.replace(br, "-$1").toLowerCase(), (d = a.ownerDocument.defaultView) && (e = d.getComputedStyle(a, null)) && (c = e.getPropertyValue(b), c === "" && !f.contains(a.ownerDocument.documentElement, a) && (c = f.style(a, b))), !f.support.pixelMargin && e && bv.test(b) && bt.test(c) && (g = h.width, h.width = c, c = e.width, h.width = g);
		return c
	}), c.documentElement.currentStyle && (bA = function (a, b) {
		var c, d, e, f = a.currentStyle && a.currentStyle[b],
			g = a.style;
		f == null && g && (e = g[b]) && (f = e), bt.test(f) && (c = g.left, d = a.runtimeStyle && a.runtimeStyle.left, d && (a.runtimeStyle.left = a.currentStyle.left), g.left = b === "fontSize" ? "1em" : f, f = g.pixelLeft + "px", g.left = c, d && (a.runtimeStyle.left = d));
		return f === "" ? "auto" : f
	}), by = bz || bA, f.each(["height", "width"], function (a, b) {
		f.cssHooks[b] = {
			get: function (a, c, d) {
				if (c) {
					return a.offsetWidth !== 0 ? bB(a, b, d) : f.swap(a, bw, function () {
						return bB(a, b, d)
					})
				}
			},
			set: function (a, b) {
				return bs.test(b) ? b + "px" : b
			}
		}
	}), f.support.opacity || (f.cssHooks.opacity = {
		get: function (a, b) {
			return bq.test((b && a.currentStyle ? a.currentStyle.filter : a.style.filter) || "") ? parseFloat(RegExp.$1) / 100 + "" : b ? "1" : ""
		},
		set: function (a, b) {
			var c = a.style,
				d = a.currentStyle,
				e = f.isNumeric(b) ? "alpha(opacity=" + b * 100 + ")" : "",
				g = d && d.filter || c.filter || "";
			c.zoom = 1;
			if (b >= 1 && f.trim(g.replace(bp, "")) === "") {
				c.removeAttribute("filter");
				if (d && !d.filter) {
					return
				}
			}
			c.filter = bp.test(g) ? g.replace(bp, e) : g + " " + e
		}
	}), f(function () {
		f.support.reliableMarginRight || (f.cssHooks.marginRight = {
			get: function (a, b) {
				return f.swap(a, {
					display: "inline-block"
				}, function () {
					return b ? by(a, "margin-right") : a.style.marginRight
				})
			}
		})
	}), f.expr && f.expr.filters && (f.expr.filters.hidden = function (a) {
		var b = a.offsetWidth,
			c = a.offsetHeight;
		return b === 0 && c === 0 || !f.support.reliableHiddenOffsets && (a.style && a.style.display || f.css(a, "display")) === "none"
	}, f.expr.filters.visible = function (a) {
		return !f.expr.filters.hidden(a)
	}), f.each({
		margin: "",
		padding: "",
		border: "Width"
	}, function (a, b) {
		f.cssHooks[a + b] = {
			expand: function (c) {
				var d, e = typeof c == "string" ? c.split(" ") : [c],
					f = {};
				for (d = 0; d < 4; d++) {
					f[a + bx[d] + b] = e[d] || e[d - 2] || e[0]
				}
				return f
			}
		}
	});
	var bC = /%20/g,
		bD = /\[\]$/,
		bE = /\r?\n/g,
		bF = /#.*$/,
		bG = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg,
		bH = /^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,
		bI = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,
		bJ = /^(?:GET|HEAD)$/,
		bK = /^\/\//,
		bL = /\?/,
		bM = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
		bN = /^(?:select|textarea)/i,
		bO = /\s+/,
		bP = /([?&])_=[^&]*/,
		bQ = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,
		bR = f.fn.load,
		bS = {},
		bT = {},
		bU, bV, bW = ["*/"] + ["*"];
	try {
		bU = e.href
	} catch (bX) {
		bU = c.createElement("a"), bU.href = "", bU = bU.href
	}
	bV = bQ.exec(bU.toLowerCase()) || [], f.fn.extend({
		load: function (a, c, d) {
			if (typeof a != "string" && bR) {
				return bR.apply(this, arguments)
			}
			if (!this.length) {
				return this
			}
			var e = a.indexOf(" ");
			if (e >= 0) {
				var g = a.slice(e, a.length);
				a = a.slice(0, e)
			}
			var h = "GET";
			c && (f.isFunction(c) ? (d = c, c = b) : typeof c == "object" && (c = f.param(c, f.ajaxSettings.traditional), h = "POST"));
			var i = this;
			f.ajax({
				url: a,
				type: h,
				dataType: "html",
				data: c,
				complete: function (a, b, c) {
					c = a.responseText, a.isResolved() && (a.done(function (a) {
						c = a
					}), i.html(g ? f("<div>").append(c.replace(bM, "")).find(g) : c)), d && i.each(d, [c, b, a])
				}
			});
			return this
		},
		serialize: function () {
			return f.param(this.serializeArray())
		},
		serializeArray: function () {
			return this.map(function () {
				return this.elements ? f.makeArray(this.elements) : this
			}).filter(function () {
				return this.name && !this.disabled && (this.checked || bN.test(this.nodeName) || bH.test(this.type))
			}).map(function (a, b) {
				var c = f(this).val();
				return c == null ? null : f.isArray(c) ? f.map(c, function (a, c) {
					return {
						name: b.name,
						value: a.replace(bE, "\r\n")
					}
				}) : {
					name: b.name,
					value: c.replace(bE, "\r\n")
				}
			}).get()
		}
	}), f.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "), function (a, b) {
		f.fn[b] = function (a) {
			return this.on(b, a)
		}
	}), f.each(["get", "post"], function (a, c) {
		f[c] = function (a, d, e, g) {
			f.isFunction(d) && (g = g || e, e = d, d = b);
			return f.ajax({
				type: c,
				url: a,
				data: d,
				success: e,
				dataType: g
			})
		}
	}), f.extend({
		getScript: function (a, c) {
			return f.get(a, b, c, "script")
		},
		getJSON: function (a, b, c) {
			return f.get(a, b, c, "json")
		},
		ajaxSetup: function (a, b) {
			b ? b$(a, f.ajaxSettings) : (b = a, a = f.ajaxSettings), b$(a, b);
			return a
		},
		ajaxSettings: {
			url: bU,
			isLocal: bI.test(bV[1]),
			global: !0,
			type: "GET",
			contentType: "application/x-www-form-urlencoded; charset=UTF-8",
			processData: !0,
			async: !0,
			accepts: {
				xml: "application/xml, text/xml",
				html: "text/html",
				text: "text/plain",
				json: "application/json, text/javascript",
				"*": bW
			},
			contents: {
				xml: /xml/,
				html: /html/,
				json: /json/
			},
			responseFields: {
				xml: "responseXML",
				text: "responseText"
			},
			converters: {
				"* text": a.String,
				"text html": !0,
				"text json": f.parseJSON,
				"text xml": f.parseXML
			},
			flatOptions: {
				context: !0,
				url: !0
			}
		},
		ajaxPrefilter: bY(bS),
		ajaxTransport: bY(bT),
		ajax: function (a, c) {
			function w(a, c, l, m) {
				if (s !== 2) {
					s = 2, q && clearTimeout(q), p = b, n = m || "", v.readyState = a > 0 ? 4 : 0;
					var o, r, u, w = c,
						x = l ? ca(d, v, l) : b,
						y, z;
					if (a >= 200 && a < 300 || a === 304) {
						if (d.ifModified) {
							if (y = v.getResponseHeader("Last-Modified")) {
								f.lastModified[k] = y
							}
							if (z = v.getResponseHeader("Etag")) {
								f.etag[k] = z
							}
						}
						if (a === 304) {
							w = "notmodified", o = !0
						} else {
							try {
								r = cb(d, x), w = "success", o = !0
							} catch (A) {
								w = "parsererror", u = A
							}
						}
					} else {
						u = w;
						if (!w || a) {
							w = "error", a < 0 && (a = 0)
						}
					}
					v.status = a, v.statusText = "" + (c || w), o ? h.resolveWith(e, [r, w, v]) : h.rejectWith(e, [v, w, u]), v.statusCode(j), j = b, t && g.trigger("ajax" + (o ? "Success" : "Error"), [v, d, o ? r : u]), i.fireWith(e, [v, w]), t && (g.trigger("ajaxComplete", [v, d]), --f.active || f.event.trigger("ajaxStop"))
				}
			}
			typeof a == "object" && (c = a, a = b), c = c || {};
			var d = f.ajaxSetup({}, c),
				e = d.context || d,
				g = e !== d && (e.nodeType || e instanceof f) ? f(e) : f.event,
				h = f.Deferred(),
				i = f.Callbacks("once memory"),
				j = d.statusCode || {},
				k, l = {},
				m = {},
				n, o, p, q, r, s = 0,
				t, u, v = {
					readyState: 0,
					setRequestHeader: function (a, b) {
						if (!s) {
							var c = a.toLowerCase();
							a = m[c] = m[c] || a, l[a] = b
						}
						return this
					},
					getAllResponseHeaders: function () {
						return s === 2 ? n : null
					},
					getResponseHeader: function (a) {
						var c;
						if (s === 2) {
							if (!o) {
								o = {};
								while (c = bG.exec(n)) {
									o[c[1].toLowerCase()] = c[2]
								}
							}
							c = o[a.toLowerCase()]
						}
						return c === b ? null : c
					},
					overrideMimeType: function (a) {
						s || (d.mimeType = a);
						return this
					},
					abort: function (a) {
						a = a || "abort", p && p.abort(a), w(0, a);
						return this
					}
				};
			h.promise(v), v.success = v.done, v.error = v.fail, v.complete = i.add, v.statusCode = function (a) {
				if (a) {
					var b;
					if (s < 2) {
						for (b in a) {
							j[b] = [j[b], a[b]]
						}
					} else {
						b = a[v.status], v.then(b, b)
					}
				}
				return this
			}, d.url = ((a || d.url) + "").replace(bF, "").replace(bK, bV[1] + "//"), d.dataTypes = f.trim(d.dataType || "*").toLowerCase().split(bO), d.crossDomain == null && (r = bQ.exec(d.url.toLowerCase()), d.crossDomain = !(!r || r[1] == bV[1] && r[2] == bV[2] && (r[3] || (r[1] === "http:" ? 80 : 443)) == (bV[3] || (bV[1] === "http:" ? 80 : 443)))), d.data && d.processData && typeof d.data != "string" && (d.data = f.param(d.data, d.traditional)), bZ(bS, d, c, v);
			if (s === 2) {
				return !1
			}
			t = d.global, d.type = d.type.toUpperCase(), d.hasContent = !bJ.test(d.type), t && f.active++ === 0 && f.event.trigger("ajaxStart");
			if (!d.hasContent) {
				d.data && (d.url += (bL.test(d.url) ? "&" : "?") + d.data, delete d.data), k = d.url;
				if (d.cache === !1) {
					var x = f.now(),
						y = d.url.replace(bP, "$1_=" + x);
					d.url = y + (y === d.url ? (bL.test(d.url) ? "&" : "?") + "_=" + x : "")
				}
			}(d.data && d.hasContent && d.contentType !== !1 || c.contentType) && v.setRequestHeader("Content-Type", d.contentType), d.ifModified && (k = k || d.url, f.lastModified[k] && v.setRequestHeader("If-Modified-Since", f.lastModified[k]), f.etag[k] && v.setRequestHeader("If-None-Match", f.etag[k])), v.setRequestHeader("Accept", d.dataTypes[0] && d.accepts[d.dataTypes[0]] ? d.accepts[d.dataTypes[0]] + (d.dataTypes[0] !== "*" ? ", " + bW + "; q=0.01" : "") : d.accepts["*"]);
			for (u in d.headers) {
				v.setRequestHeader(u, d.headers[u])
			}
			if (d.beforeSend && (d.beforeSend.call(e, v, d) === !1 || s === 2)) {
				v.abort();
				return !1
			}
			for (u in {
					success: 1,
					error: 1,
					complete: 1
				}) {
				v[u](d[u])
			}
			p = bZ(bT, d, c, v);
			if (!p) {
				w(-1, "No Transport")
			} else {
				v.readyState = 1, t && g.trigger("ajaxSend", [v, d]), d.async && d.timeout > 0 && (q = setTimeout(function () {
					v.abort("timeout")
				}, d.timeout));
				try {
					s = 1, p.send(l, w)
				} catch (z) {
					if (s < 2) {
						w(-1, z)
					} else {
						throw z
					}
				}
			}
			return v
		},
		param: function (a, c) {
			var d = [],
				e = function (a, b) {
					b = f.isFunction(b) ? b() : b, d[d.length] = encodeURIComponent(a) + "=" + encodeURIComponent(b)
				};
			c === b && (c = f.ajaxSettings.traditional);
			if (f.isArray(a) || a.jquery && !f.isPlainObject(a)) {
				f.each(a, function () {
					e(this.name, this.value)
				})
			} else {
				for (var g in a) {
					b_(g, a[g], c, e)
				}
			}
			return d.join("&").replace(bC, "+")
		}
	}), f.extend({
		active: 0,
		lastModified: {},
		etag: {}
	});
	var cc = f.now(),
		cd = /(\=)\?(&|$)|\?\?/i;
	f.ajaxSetup({
		jsonp: "callback",
		jsonpCallback: function () {
			return f.expando + "_" + cc++
		}
	}), f.ajaxPrefilter("json jsonp", function (b, c, d) {
		var e = typeof b.data == "string" && /^application\/x\-www\-form\-urlencoded/.test(b.contentType);
		if (b.dataTypes[0] === "jsonp" || b.jsonp !== !1 && (cd.test(b.url) || e && cd.test(b.data))) {
			var g, h = b.jsonpCallback = f.isFunction(b.jsonpCallback) ? b.jsonpCallback() : b.jsonpCallback,
				i = a[h],
				j = b.url,
				k = b.data,
				l = "$1" + h + "$2";
			b.jsonp !== !1 && (j = j.replace(cd, l), b.url === j && (e && (k = k.replace(cd, l)), b.data === k && (j += (/\?/.test(j) ? "&" : "?") + b.jsonp + "=" + h))), b.url = j, b.data = k, a[h] = function (a) {
				g = [a]
			}, d.always(function () {
				a[h] = i, g && f.isFunction(i) && a[h](g[0])
			}), b.converters["script json"] = function () {
				g || f.error(h + " was not called");
				return g[0]
			}, b.dataTypes[0] = "json";
			return "script"
		}
	}), f.ajaxSetup({
		accepts: {
			script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
		},
		contents: {
			script: /javascript|ecmascript/
		},
		converters: {
			"text script": function (a) {
				f.globalEval(a);
				return a
			}
		}
	}), f.ajaxPrefilter("script", function (a) {
		a.cache === b && (a.cache = !1), a.crossDomain && (a.type = "GET", a.global = !1)
	}), f.ajaxTransport("script", function (a) {
		if (a.crossDomain) {
			var d, e = c.head || c.getElementsByTagName("head")[0] || c.documentElement;
			return {
				send: function (f, g) {
					d = c.createElement("script"), d.async = "async", a.scriptCharset && (d.charset = a.scriptCharset), d.src = a.url, d.onload = d.onreadystatechange = function (a, c) {
						if (c || !d.readyState || /loaded|complete/.test(d.readyState)) {
							d.onload = d.onreadystatechange = null, e && d.parentNode && e.removeChild(d), d = b, c || g(200, "success")
						}
					}, e.insertBefore(d, e.firstChild)
				},
				abort: function () {
					d && d.onload(0, 1)
				}
			}
		}
	});
	var ce = a.ActiveXObject ? function () {
			for (var a in cg) {
				cg[a](0, 1)
			}
		} : !1,
		cf = 0,
		cg;
	f.ajaxSettings.xhr = a.ActiveXObject ? function () {
			return !this.isLocal && ch() || ci()
		} : ch,
		function (a) {
			f.extend(f.support, {
				ajax: !!a,
				cors: !!a && "withCredentials" in a
			})
		}(f.ajaxSettings.xhr()), f.support.ajax && f.ajaxTransport(function (c) {
			if (!c.crossDomain || f.support.cors) {
				var d;
				return {
					send: function (e, g) {
						var h = c.xhr(),
							i, j;
						c.username ? h.open(c.type, c.url, c.async, c.username, c.password) : h.open(c.type, c.url, c.async);
						if (c.xhrFields) {
							for (j in c.xhrFields) {
								h[j] = c.xhrFields[j]
							}
						}
						c.mimeType && h.overrideMimeType && h.overrideMimeType(c.mimeType), !c.crossDomain && !e["X-Requested-With"] && (e["X-Requested-With"] = "XMLHttpRequest");
						try {
							for (j in e) {
								h.setRequestHeader(j, e[j])
							}
						} catch (k) {}
						h.send(c.hasContent && c.data || null), d = function (a, e) {
							var j, k, l, m, n;
							try {
								if (d && (e || h.readyState === 4)) {
									d = b, i && (h.onreadystatechange = f.noop, ce && delete cg[i]);
									if (e) {
										h.readyState !== 4 && h.abort()
									} else {
										j = h.status, l = h.getAllResponseHeaders(), m = {}, n = h.responseXML, n && n.documentElement && (m.xml = n);
										try {
											m.text = h.responseText
										} catch (a) {}
										try {
											k = h.statusText
										} catch (o) {
											k = ""
										}!j && c.isLocal && !c.crossDomain ? j = m.text ? 200 : 404 : j === 1223 && (j = 204)
									}
								}
							} catch (p) {
								e || g(-1, p)
							}
							m && g(j, k, m, l)
						}, !c.async || h.readyState === 4 ? d() : (i = ++cf, ce && (cg || (cg = {}, f(a).unload(ce)), cg[i] = d), h.onreadystatechange = d)
					},
					abort: function () {
						d && d(0, 1)
					}
				}
			}
		});
	var cj = {},
		ck, cl, cm = /^(?:toggle|show|hide)$/,
		cn = /^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i,
		co, cp = [
			["height", "marginTop", "marginBottom", "paddingTop", "paddingBottom"],
			["width", "marginLeft", "marginRight", "paddingLeft", "paddingRight"],
			["opacity"]
		],
		cq;
	f.fn.extend({
		show: function (a, b, c) {
			var d, e;
			if (a || a === 0) {
				return this.animate(ct("show", 3), a, b, c)
			}
			for (var g = 0, h = this.length; g < h; g++) {
				d = this[g], d.style && (e = d.style.display, !f._data(d, "olddisplay") && e === "none" && (e = d.style.display = ""), (e === "" && f.css(d, "display") === "none" || !f.contains(d.ownerDocument.documentElement, d)) && f._data(d, "olddisplay", cu(d.nodeName)))
			}
			for (g = 0; g < h; g++) {
				d = this[g];
				if (d.style) {
					e = d.style.display;
					if (e === "" || e === "none") {
						d.style.display = f._data(d, "olddisplay") || ""
					}
				}
			}
			return this
		},
		hide: function (a, b, c) {
			if (a || a === 0) {
				return this.animate(ct("hide", 3), a, b, c)
			}
			var d, e, g = 0,
				h = this.length;
			for (; g < h; g++) {
				d = this[g], d.style && (e = f.css(d, "display"), e !== "none" && !f._data(d, "olddisplay") && f._data(d, "olddisplay", e))
			}
			for (g = 0; g < h; g++) {
				this[g].style && (this[g].style.display = "none")
			}
			return this
		},
		_toggle: f.fn.toggle,
		toggle: function (a, b, c) {
			var d = typeof a == "boolean";
			f.isFunction(a) && f.isFunction(b) ? this._toggle.apply(this, arguments) : a == null || d ? this.each(function () {
				var b = d ? a : f(this).is(":hidden");
				f(this)[b ? "show" : "hide"]()
			}) : this.animate(ct("toggle", 3), a, b, c);
			return this
		},
		fadeTo: function (a, b, c, d) {
			return this.filter(":hidden").css("opacity", 0).show().end().animate({
				opacity: b
			}, a, c, d)
		},
		animate: function (a, b, c, d) {
			function g() {
				e.queue === !1 && f._mark(this);
				var b = f.extend({}, e),
					c = this.nodeType === 1,
					d = c && f(this).is(":hidden"),
					g, h, i, j, k, l, m, n, o, p, q;
				b.animatedProperties = {};
				for (i in a) {
					g = f.camelCase(i), i !== g && (a[g] = a[i], delete a[i]);
					if ((k = f.cssHooks[g]) && "expand" in k) {
						l = k.expand(a[g]), delete a[g];
						for (i in l) {
							i in a || (a[i] = l[i])
						}
					}
				}
				for (g in a) {
					h = a[g], f.isArray(h) ? (b.animatedProperties[g] = h[1], h = a[g] = h[0]) : b.animatedProperties[g] = b.specialEasing && b.specialEasing[g] || b.easing || "swing";
					if (h === "hide" && d || h === "show" && !d) {
						return b.complete.call(this)
					}
					c && (g === "height" || g === "width") && (b.overflow = [this.style.overflow, this.style.overflowX, this.style.overflowY], f.css(this, "display") === "inline" && f.css(this, "float") === "none" && (!f.support.inlineBlockNeedsLayout || cu(this.nodeName) === "inline" ? this.style.display = "inline-block" : this.style.zoom = 1))
				}
				b.overflow != null && (this.style.overflow = "hidden");
				for (i in a) {
					j = new f.fx(this, b, i), h = a[i], cm.test(h) ? (q = f._data(this, "toggle" + i) || (h === "toggle" ? d ? "show" : "hide" : 0), q ? (f._data(this, "toggle" + i, q === "show" ? "hide" : "show"), j[q]()) : j[h]()) : (m = cn.exec(h), n = j.cur(), m ? (o = parseFloat(m[2]), p = m[3] || (f.cssNumber[i] ? "" : "px"), p !== "px" && (f.style(this, i, (o || 1) + p), n = (o || 1) / j.cur() * n, f.style(this, i, n + p)), m[1] && (o = (m[1] === "-=" ? -1 : 1) * o + n), j.custom(n, o, p)) : j.custom(n, h, ""))
				}
				return !0
			}
			var e = f.speed(b, c, d);
			if (f.isEmptyObject(a)) {
				return this.each(e.complete, [!1])
			}
			a = f.extend({}, a);
			return e.queue === !1 ? this.each(g) : this.queue(e.queue, g)
		},
		stop: function (a, c, d) {
			typeof a != "string" && (d = c, c = a, a = b), c && a !== !1 && this.queue(a || "fx", []);
			return this.each(function () {
				function h(a, b, c) {
					var e = b[c];
					f.removeData(a, c, !0), e.stop(d)
				}
				var b, c = !1,
					e = f.timers,
					g = f._data(this);
				d || f._unmark(!0, this);
				if (a == null) {
					for (b in g) {
						g[b] && g[b].stop && b.indexOf(".run") === b.length - 4 && h(this, g, b)
					}
				} else {
					g[b = a + ".run"] && g[b].stop && h(this, g, b)
				}
				for (b = e.length; b--;) {
					e[b].elem === this && (a == null || e[b].queue === a) && (d ? e[b](!0) : e[b].saveState(), c = !0, e.splice(b, 1))
				}(!d || !c) && f.dequeue(this, a)
			})
		}
	}), f.each({
		slideDown: ct("show", 1),
		slideUp: ct("hide", 1),
		slideToggle: ct("toggle", 1),
		fadeIn: {
			opacity: "show"
		},
		fadeOut: {
			opacity: "hide"
		},
		fadeToggle: {
			opacity: "toggle"
		}
	}, function (a, b) {
		f.fn[a] = function (a, c, d) {
			return this.animate(b, a, c, d)
		}
	}), f.extend({
		speed: function (a, b, c) {
			var d = a && typeof a == "object" ? f.extend({}, a) : {
				complete: c || !c && b || f.isFunction(a) && a,
				duration: a,
				easing: c && b || b && !f.isFunction(b) && b
			};
			d.duration = f.fx.off ? 0 : typeof d.duration == "number" ? d.duration : d.duration in f.fx.speeds ? f.fx.speeds[d.duration] : f.fx.speeds._default;
			if (d.queue == null || d.queue === !0) {
				d.queue = "fx"
			}
			d.old = d.complete, d.complete = function (a) {
				f.isFunction(d.old) && d.old.call(this), d.queue ? f.dequeue(this, d.queue) : a !== !1 && f._unmark(this)
			};
			return d
		},
		easing: {
			linear: function (a) {
				return a
			},
			swing: function (a) {
				return -Math.cos(a * Math.PI) / 2 + 0.5
			}
		},
		timers: [],
		fx: function (a, b, c) {
			this.options = b, this.elem = a, this.prop = c, b.orig = b.orig || {}
		}
	}), f.fx.prototype = {
		update: function () {
			this.options.step && this.options.step.call(this.elem, this.now, this), (f.fx.step[this.prop] || f.fx.step._default)(this)
		},
		cur: function () {
			if (this.elem[this.prop] != null && (!this.elem.style || this.elem.style[this.prop] == null)) {
				return this.elem[this.prop]
			}
			var a, b = f.css(this.elem, this.prop);
			return isNaN(a = parseFloat(b)) ? !b || b === "auto" ? 0 : b : a
		},
		custom: function (a, c, d) {
			function h(a) {
				return e.step(a)
			}
			var e = this,
				g = f.fx;
			this.startTime = cq || cr(), this.end = c, this.now = this.start = a, this.pos = this.state = 0, this.unit = d || this.unit || (f.cssNumber[this.prop] ? "" : "px"), h.queue = this.options.queue, h.elem = this.elem, h.saveState = function () {
				f._data(e.elem, "fxshow" + e.prop) === b && (e.options.hide ? f._data(e.elem, "fxshow" + e.prop, e.start) : e.options.show && f._data(e.elem, "fxshow" + e.prop, e.end))
			}, h() && f.timers.push(h) && !co && (co = setInterval(g.tick, g.interval))
		},
		show: function () {
			var a = f._data(this.elem, "fxshow" + this.prop);
			this.options.orig[this.prop] = a || f.style(this.elem, this.prop), this.options.show = !0, a !== b ? this.custom(this.cur(), a) : this.custom(this.prop === "width" || this.prop === "height" ? 1 : 0, this.cur()), f(this.elem).show()
		},
		hide: function () {
			this.options.orig[this.prop] = f._data(this.elem, "fxshow" + this.prop) || f.style(this.elem, this.prop), this.options.hide = !0, this.custom(this.cur(), 0)
		},
		step: function (a) {
			var b, c, d, e = cq || cr(),
				g = !0,
				h = this.elem,
				i = this.options;
			if (a || e >= i.duration + this.startTime) {
				this.now = this.end, this.pos = this.state = 1, this.update(), i.animatedProperties[this.prop] = !0;
				for (b in i.animatedProperties) {
					i.animatedProperties[b] !== !0 && (g = !1)
				}
				if (g) {
					i.overflow != null && !f.support.shrinkWrapBlocks && f.each(["", "X", "Y"], function (a, b) {
						h.style["overflow" + b] = i.overflow[a]
					}), i.hide && f(h).hide();
					if (i.hide || i.show) {
						for (b in i.animatedProperties) {
							f.style(h, b, i.orig[b]), f.removeData(h, "fxshow" + b, !0), f.removeData(h, "toggle" + b, !0)
						}
					}
					d = i.complete, d && (i.complete = !1, d.call(h))
				}
				return !1
			}
			i.duration == Infinity ? this.now = e : (c = e - this.startTime, this.state = c / i.duration, this.pos = f.easing[i.animatedProperties[this.prop]](this.state, c, 0, 1, i.duration), this.now = this.start + (this.end - this.start) * this.pos), this.update();
			return !0
		}
	}, f.extend(f.fx, {
		tick: function () {
			var a, b = f.timers,
				c = 0;
			for (; c < b.length; c++) {
				a = b[c], !a() && b[c] === a && b.splice(c--, 1)
			}
			b.length || f.fx.stop()
		},
		interval: 13,
		stop: function () {
			clearInterval(co), co = null
		},
		speeds: {
			slow: 600,
			fast: 200,
			_default: 400
		},
		step: {
			opacity: function (a) {
				f.style(a.elem, "opacity", a.now)
			},
			_default: function (a) {
				a.elem.style && a.elem.style[a.prop] != null ? a.elem.style[a.prop] = a.now + a.unit : a.elem[a.prop] = a.now
			}
		}
	}), f.each(cp.concat.apply([], cp), function (a, b) {
		b.indexOf("margin") && (f.fx.step[b] = function (a) {
			f.style(a.elem, b, Math.max(0, a.now) + a.unit)
		})
	}), f.expr && f.expr.filters && (f.expr.filters.animated = function (a) {
		return f.grep(f.timers, function (b) {
			return a === b.elem
		}).length
	});
	var cv, cw = /^t(?:able|d|h)$/i,
		cx = /^(?:body|html)$/i;
	"getBoundingClientRect" in c.documentElement ? cv = function (a, b, c, d) {
		try {
			d = a.getBoundingClientRect()
		} catch (e) {}
		if (!d || !f.contains(c, a)) {
			return d ? {
				top: d.top,
				left: d.left
			} : {
				top: 0,
				left: 0
			}
		}
		var g = b.body,
			h = cy(b),
			i = c.clientTop || g.clientTop || 0,
			j = c.clientLeft || g.clientLeft || 0,
			k = h.pageYOffset || f.support.boxModel && c.scrollTop || g.scrollTop,
			l = h.pageXOffset || f.support.boxModel && c.scrollLeft || g.scrollLeft,
			m = d.top + k - i,
			n = d.left + l - j;
		return {
			top: m,
			left: n
		}
	} : cv = function (a, b, c) {
		var d, e = a.offsetParent,
			g = a,
			h = b.body,
			i = b.defaultView,
			j = i ? i.getComputedStyle(a, null) : a.currentStyle,
			k = a.offsetTop,
			l = a.offsetLeft;
		while ((a = a.parentNode) && a !== h && a !== c) {
			if (f.support.fixedPosition && j.position === "fixed") {
				break
			}
			d = i ? i.getComputedStyle(a, null) : a.currentStyle, k -= a.scrollTop, l -= a.scrollLeft, a === e && (k += a.offsetTop, l += a.offsetLeft, f.support.doesNotAddBorder && (!f.support.doesAddBorderForTableAndCells || !cw.test(a.nodeName)) && (k += parseFloat(d.borderTopWidth) || 0, l += parseFloat(d.borderLeftWidth) || 0), g = e, e = a.offsetParent), f.support.subtractsBorderForOverflowNotVisible && d.overflow !== "visible" && (k += parseFloat(d.borderTopWidth) || 0, l += parseFloat(d.borderLeftWidth) || 0), j = d
		}
		if (j.position === "relative" || j.position === "static") {
			k += h.offsetTop, l += h.offsetLeft
		}
		f.support.fixedPosition && j.position === "fixed" && (k += Math.max(c.scrollTop, h.scrollTop), l += Math.max(c.scrollLeft, h.scrollLeft));
		return {
			top: k,
			left: l
		}
	}, f.fn.offset = function (a) {
		if (arguments.length) {
			return a === b ? this : this.each(function (b) {
				f.offset.setOffset(this, a, b)
			})
		}
		var c = this[0],
			d = c && c.ownerDocument;
		if (!d) {
			return null
		}
		if (c === d.body) {
			return f.offset.bodyOffset(c)
		}
		return cv(c, d, d.documentElement)
	}, f.offset = {
		bodyOffset: function (a) {
			var b = a.offsetTop,
				c = a.offsetLeft;
			f.support.doesNotIncludeMarginInBodyOffset && (b += parseFloat(f.css(a, "marginTop")) || 0, c += parseFloat(f.css(a, "marginLeft")) || 0);
			return {
				top: b,
				left: c
			}
		},
		setOffset: function (a, b, c) {
			var d = f.css(a, "position");
			d === "static" && (a.style.position = "relative");
			var e = f(a),
				g = e.offset(),
				h = f.css(a, "top"),
				i = f.css(a, "left"),
				j = (d === "absolute" || d === "fixed") && f.inArray("auto", [h, i]) > -1,
				k = {},
				l = {},
				m, n;
			j ? (l = e.position(), m = l.top, n = l.left) : (m = parseFloat(h) || 0, n = parseFloat(i) || 0), f.isFunction(b) && (b = b.call(a, c, g)), b.top != null && (k.top = b.top - g.top + m), b.left != null && (k.left = b.left - g.left + n), "using" in b ? b.using.call(a, k) : e.css(k)
		}
	}, f.fn.extend({
		position: function () {
			if (!this[0]) {
				return null
			}
			var a = this[0],
				b = this.offsetParent(),
				c = this.offset(),
				d = cx.test(b[0].nodeName) ? {
					top: 0,
					left: 0
				} : b.offset();
			c.top -= parseFloat(f.css(a, "marginTop")) || 0, c.left -= parseFloat(f.css(a, "marginLeft")) || 0, d.top += parseFloat(f.css(b[0], "borderTopWidth")) || 0, d.left += parseFloat(f.css(b[0], "borderLeftWidth")) || 0;
			return {
				top: c.top - d.top,
				left: c.left - d.left
			}
		},
		offsetParent: function () {
			return this.map(function () {
				var a = this.offsetParent || c.body;
				while (a && !cx.test(a.nodeName) && f.css(a, "position") === "static") {
					a = a.offsetParent
				}
				return a
			})
		}
	}), f.each({
		scrollLeft: "pageXOffset",
		scrollTop: "pageYOffset"
	}, function (a, c) {
		var d = /Y/.test(c);
		f.fn[a] = function (e) {
			return f.access(this, function (a, e, g) {
				var h = cy(a);
				if (g === b) {
					return h ? c in h ? h[c] : f.support.boxModel && h.document.documentElement[e] || h.document.body[e] : a[e]
				}
				h ? h.scrollTo(d ? f(h).scrollLeft() : g, d ? g : f(h).scrollTop()) : a[e] = g
			}, a, e, arguments.length, null)
		}
	}), f.each({
		Height: "height",
		Width: "width"
	}, function (a, c) {
		var d = "client" + a,
			e = "scroll" + a,
			g = "offset" + a;
		f.fn["inner" + a] = function () {
			var a = this[0];
			return a ? a.style ? parseFloat(f.css(a, c, "padding")) : this[c]() : null
		}, f.fn["outer" + a] = function (a) {
			var b = this[0];
			return b ? b.style ? parseFloat(f.css(b, c, a ? "margin" : "border")) : this[c]() : null
		}, f.fn[c] = function (a) {
			return f.access(this, function (a, c, h) {
				var i, j, k, l;
				if (f.isWindow(a)) {
					i = a.document, j = i.documentElement[d];
					return f.support.boxModel && j || i.body && i.body[d] || j
				}
				if (a.nodeType === 9) {
					i = a.documentElement;
					if (i[d] >= i[e]) {
						return i[d]
					}
					return Math.max(a.body[e], i[e], a.body[g], i[g])
				}
				if (h === b) {
					k = f.css(a, c), l = parseFloat(k);
					return f.isNumeric(l) ? l : k
				}
				f(a).css(c, h)
			}, c, a, arguments.length, null)
		}
	}), a.jQuery = a.$ = f, typeof define == "function" && define.amd && define.amd.jQuery && define("jquery", [], function () {
		return f
	})
})(window);
String.prototype.parseColor = function () {
	var a = "#";
	if (this.slice(0, 4) == "rgb(") {
		var b = this.slice(4, this.length - 1).split(",");
		var c = 0;
		do {
			a += parseInt(b[c]).toColorPart()
		} while (++c < 3)
	} else {
		if (this.slice(0, 1) == "#") {
			if (this.length == 4) {
				for (var c = 1; c < 4; c++) {
					a += (this.charAt(c) + this.charAt(c)).toLowerCase()
				}
			}
			if (this.length == 7) {
				a = this.toLowerCase()
			}
		}
	}
	return a.length == 7 ? a : arguments[0] || this
};
Element.collectTextNodes = function (a) {
	return $A($(a).childNodes).collect(function (a) {
		return a.nodeType == 3 ? a.nodeValue : a.hasChildNodes() ? Element.collectTextNodes(a) : ""
	}).flatten().join("")
};
Element.collectTextNodesIgnoreClass = function (a, b) {
	return $A($(a).childNodes).collect(function (a) {
		return a.nodeType == 3 ? a.nodeValue : a.hasChildNodes() && !Element.hasClassName(a, b) ? Element.collectTextNodesIgnoreClass(a, b) : ""
	}).flatten().join("")
};
Element.setContentZoom = function (a, b) {
	a = $(a);
	a.setStyle({
		fontSize: b / 100 + "em"
	});
	if (navigator.appVersion.indexOf("AppleWebKit") > 0) {
		window.scrollBy(0, 0)
	}
	return a
};
Element.getOpacity = function (a) {
	return $(a).getStyle("opacity")
};
Element.setOpacity = function (a, b) {
	return $(a).setStyle({
		opacity: b
	})
};
Element.getInlineOpacity = function (a) {
	return $(a).style.opacity || ""
};
Element.forceRerendering = function (a) {
	try {
		a = $(a);
		var b = document.createTextNode(" ");
		a.appendChild(b);
		a.removeChild(b)
	} catch (c) {}
};
Array.prototype.call = function () {
	var a = arguments;
	this.each(function (b) {
		b.apply(this, a)
	})
};
var Effect = {
	_elementDoesNotExistError: {
		name: "ElementDoesNotExistError",
		message: "The specified DOM element does not exist, but is required for this effect to operate"
	},
	tagifyText: function (a) {
		if (typeof Builder == "undefined") {
			throw "Effect.tagifyText requires including script.aculo.us' builder.js library"
		}
		var b = "position:relative";
		if (/MSIE/.test(navigator.userAgent) && !window.opera) {
			b += ";zoom:1"
		}
		a = $(a);
		$A(a.childNodes).each(function (c) {
			if (c.nodeType == 3) {
				c.nodeValue.toArray().each(function (d) {
					a.insertBefore(Builder.node("span", {
						style: b
					}, d == " " ? String.fromCharCode(160) : d), c)
				});
				Element.remove(c)
			}
		})
	},
	multiple: function (a, b) {
		var c;
		if ((typeof a == "object" || typeof a == "function") && a.length) {
			c = a
		} else {
			c = $(a).childNodes
		}
		var d = Object.extend({
			speed: 0.1,
			delay: 0
		}, arguments[2] || {});
		var e = d.delay;
		$A(c).each(function (a, c) {
			new b(a, Object.extend(d, {
				delay: c * d.speed + e
			}))
		})
	},
	PAIRS: {
		slide: ["SlideDown", "SlideUp"],
		blind: ["BlindDown", "BlindUp"],
		appear: ["Appear", "Fade"]
	},
	toggle: function (a, b) {
		a = $(a);
		b = (b || "appear").toLowerCase();
		var c = Object.extend({
			queue: {
				position: "end",
				scope: a.id || "global",
				limit: 1
			}
		}, arguments[2] || {});
		Effect[a.visible() ? Effect.PAIRS[b][1] : Effect.PAIRS[b][0]](a, c)
	}
};
var Effect2 = Effect;
Effect.Transitions = {
	linear: Prototype.K,
	sinoidal: function (a) {
		return -Math.cos(a * Math.PI) / 2 + 0.5
	},
	reverse: function (a) {
		return 1 - a
	},
	flicker: function (a) {
		return -Math.cos(a * Math.PI) / 4 + 0.75 + Math.random() / 4
	},
	wobble: function (a) {
		return -Math.cos(a * Math.PI * 9 * a) / 2 + 0.5
	},
	pulse: function (a, b) {
		b = b || 5;
		return Math.round(a % (1 / b) * b) == 0 ? a * b * 2 - Math.floor(a * b * 2) : 1 - (a * b * 2 - Math.floor(a * b * 2))
	},
	none: function (a) {
		return 0
	},
	full: function (a) {
		return 1
	}
};
Effect.ScopedQueue = Class.create();
Object.extend(Object.extend(Effect.ScopedQueue.prototype, Enumerable), {
	initialize: function () {
		this.effects = [];
		this.interval = null
	},
	_each: function (a) {
		this.effects._each(a)
	},
	add: function (a) {
		var b = (new Date).getTime();
		var c = typeof a.options.queue == "string" ? a.options.queue : a.options.queue.position;
		switch (c) {
			case "front":
				this.effects.findAll(function (a) {
					return a.state == "idle"
				}).each(function (b) {
					b.startOn += a.finishOn;
					b.finishOn += a.finishOn
				});
				break;
			case "with-last":
				b = this.effects.pluck("startOn").max() || b;
				break;
			case "end":
				b = this.effects.pluck("finishOn").max() || b;
				break
		}
		a.startOn += b;
		a.finishOn += b;
		if (!a.options.queue.limit || this.effects.length < a.options.queue.limit) {
			this.effects.push(a)
		}
		if (!this.interval) {
			this.interval = setInterval(this.loop.bind(this), 15)
		}
	},
	remove: function (a) {
		this.effects = this.effects.reject(function (b) {
			return b == a
		});
		if (this.effects.length == 0) {
			clearInterval(this.interval);
			this.interval = null
		}
	},
	loop: function () {
		var a = (new Date).getTime();
		for (var b = 0, c = this.effects.length; b < c; b++) {
			if (this.effects[b]) {
				this.effects[b].loop(a)
			}
		}
	}
});
Effect.Queues = {
	instances: $H(),
	get: function (a) {
		if (typeof a != "string") {
			return a
		}
		if (!this.instances[a]) {
			this.instances[a] = new Effect.ScopedQueue
		}
		return this.instances[a]
	}
};
Effect.Queue = Effect.Queues.get("global");
if (navigator.appName == "Microsoft Internet Explorer") {
	Effect.DefaultOptions = {
		transition: Effect.Transitions.sinoidal,
		duration: 1,
		sync: false,
		fps: 250,
		from: 0,
		to: 1,
		delay: 0.3,
		queue: "parallel"
	}
} else {
	Effect.DefaultOptions = {
		transition: Effect.Transitions.sinoidal,
		duration: 1,
		sync: false,
		fps: 180,
		from: 0,
		to: 1,
		delay: 0.3,
		queue: "parallel"
	}
}
Effect.Base = function () {};
Effect.Base.prototype = {
	position: null,
	start: function (a) {
		this.options = Object.extend(Object.extend({}, Effect.DefaultOptions), a || {});
		this.currentFrame = 0;
		this.state = "idle";
		this.startOn = this.options.delay * 750;
		this.finishOn = this.startOn + this.options.duration * 750;
		if (this.element != undefined) {
			if (this.element.id == "itemDiv") {
				this.startOn = this.options.delay * 5000;
				this.finishOn = this.startOn + this.options.duration * 2000
			}
		} else {
			this.startOn = this.options.delay * 5000;
			this.finishOn = this.startOn + this.options.duration * 2000
		}
		this.event("beforeStart");
		if (!this.options.sync) {
			Effect.Queues.get(typeof this.options.queue == "string" ? "global" : this.options.queue.scope).add(this)
		}
	},
	loop: function (a) {
		if (a >= this.startOn) {
			if (a >= this.finishOn) {
				this.render(1);
				this.cancel();
				this.event("beforeFinish");
				if (this.finish) {
					this.finish()
				}
				this.event("afterFinish");
				return
			}
			var b = (a - this.startOn) / (this.finishOn - this.startOn);
			var c = Math.round(b * this.options.fps * this.options.duration);
			if (c > this.currentFrame) {
				this.render(b);
				this.currentFrame = c
			}
		}
	},
	render: function (a) {
		if (this.state == "idle") {
			this.state = "running";
			this.event("beforeSetup");
			if (this.setup) {
				this.setup()
			}
			this.event("afterSetup")
		}
		if (this.state == "running") {
			if (this.options.transition) {
				a = this.options.transition(a)
			}
			a *= this.options.to - this.options.from;
			a += this.options.from;
			this.position = a;
			this.event("beforeUpdate");
			if (this.update) {
				this.update(a)
			}
			this.event("afterUpdate")
		}
		if ($("itemDivImg") != null && $("itemDivLoading") != null) {
			document.getElementById("itemDivLoading").style.display = "none";
			if (navigator.appName == "Microsoft Internet Explorer") {
				document.getElementById("itemDivImg").style.filter = "alpha(opacity=100)"
			} else {
				document.getElementById("itemDivImg").style.opacity = 1
			}
		}
	},
	cancel: function () {
		if (!this.options.sync) {
			Effect.Queues.get(typeof this.options.queue == "string" ? "global" : this.options.queue.scope).remove(this)
		}
		this.state = "finished"
	},
	event: function (a) {
		if (this.options[a + "Internal"]) {
			this.options[a + "Internal"](this)
		}
		if (this.options[a]) {
			this.options[a](this)
		}
	},
	inspect: function () {
		var a = $H();
		for (property in this) {
			if (typeof this[property] != "function") {
				a[property] = this[property]
			}
		}
		return "#<Effect:" + a.inspect() + ",options:" + $H(this.options).inspect() + ">"
	}
};
Effect.Parallel = Class.create();
Object.extend(Object.extend(Effect.Parallel.prototype, Effect.Base.prototype), {
	initialize: function (a) {
		this.effects = a || [];
		this.start(arguments[1])
	},
	update: function (a) {
		this.effects.invoke("render", a)
	},
	finish: function (a) {
		this.effects.each(function (b) {
			b.render(1);
			b.cancel();
			b.event("beforeFinish");
			if (b.finish) {
				b.finish(a)
			}
			b.event("afterFinish")
		})
	}
});
Effect.Event = Class.create();
Object.extend(Object.extend(Effect.Event.prototype, Effect.Base.prototype), {
	initialize: function () {
		var a = Object.extend({
			duration: 0
		}, arguments[0] || {});
		this.start(a)
	},
	update: Prototype.emptyFunction
});
Effect.Opacity = Class.create();
Object.extend(Object.extend(Effect.Opacity.prototype, Effect.Base.prototype), {
	initialize: function (a) {
		this.element = $(a);
		if (!this.element) {
			throw Effect._elementDoesNotExistError
		}
		if (/MSIE/.test(navigator.userAgent) && !window.opera && !this.element.currentStyle.hasLayout) {
			this.element.setStyle({
				zoom: 1
			})
		}
		var b = Object.extend({
			from: this.element.getOpacity() || 0,
			to: 1
		}, arguments[1] || {});
		this.start(b)
	},
	update: function (a) {
		this.element.setOpacity(a)
	}
});
Effect.Move = Class.create();
Object.extend(Object.extend(Effect.Move.prototype, Effect.Base.prototype), {
	initialize: function (a) {
		this.element = $(a);
		if (!this.element) {
			throw Effect._elementDoesNotExistError
		}
		var b = Object.extend({
			x: 0,
			y: 0,
			mode: "relative"
		}, arguments[1] || {});
		this.start(b)
	},
	setup: function () {
		this.element.makePositioned();
		this.originalLeft = parseFloat(this.element.getStyle("left") || "0");
		this.originalTop = parseFloat(this.element.getStyle("top") || "0");
		if (this.options.mode == "absolute") {
			this.options.x = this.options.x - this.originalLeft;
			this.options.y = this.options.y - this.originalTop
		}
	},
	update: function (a) {
		this.element.setStyle({
			left: Math.round(this.options.x * a + this.originalLeft) + "px",
			top: Math.round(this.options.y * a + this.originalTop) + "px"
		})
	}
});
Effect.MoveBy = function (a, b, c) {
	return new Effect.Move(a, Object.extend({
		x: c,
		y: b
	}, arguments[3] || {}))
};
Effect.Scale = Class.create();
Object.extend(Object.extend(Effect.Scale.prototype, Effect.Base.prototype), {
	initialize: function (a, b) {
		this.element = $(a);
		if (!this.element) {
			throw Effect._elementDoesNotExistError
		}
		var c = Object.extend({
			scaleX: true,
			scaleY: true,
			scaleContent: true,
			scaleFromCenter: false,
			scaleMode: "box",
			scaleFrom: 100,
			scaleTo: b
		}, arguments[2] || {});
		this.start(c)
	},
	setup: function () {
		this.restoreAfterFinish = this.options.restoreAfterFinish || false;
		this.elementPositioning = this.element.getStyle("position");
		this.originalStyle = {};
		["top", "left", "width", "height", "fontSize"].each(function (a) {
			this.originalStyle[a] = this.element.style[a]
		}.bind(this));
		this.originalTop = this.element.offsetTop;
		this.originalLeft = this.element.offsetLeft;
		var a = this.element.getStyle("font-size") || "100%";
		["em", "px", "%", "pt"].each(function (b) {
			if (a.indexOf(b) > 0) {
				this.fontSize = parseFloat(a);
				this.fontSizeType = b
			}
		}.bind(this));
		this.factor = (this.options.scaleTo - this.options.scaleFrom) / 100;
		this.dims = null;
		if (this.options.scaleMode == "box") {
			this.dims = [this.element.offsetHeight, this.element.offsetWidth]
		}
		if (/^content/.test(this.options.scaleMode)) {
			this.dims = [this.element.scrollHeight, this.element.scrollWidth]
		}
		if (!this.dims) {
			this.dims = [this.options.scaleMode.originalHeight, this.options.scaleMode.originalWidth]
		}
	},
	update: function (a) {
		var b = this.options.scaleFrom / 100 + this.factor * a;
		if (this.options.scaleContent && this.fontSize) {
			this.element.setStyle({
				fontSize: this.fontSize * b + this.fontSizeType
			})
		}
		this.setDimensions(this.dims[0] * b, this.dims[1] * b)
	},
	finish: function (a) {
		if (this.restoreAfterFinish) {
			this.element.setStyle(this.originalStyle)
		}
	},
	setDimensions: function (a, b) {
		var c = {};
		if (this.options.scaleX) {
			c.width = Math.round(b) + "px"
		}
		if (this.options.scaleY) {
			c.height = Math.round(a) + "px"
		}
		if (this.options.scaleFromCenter) {
			var d = (a - this.dims[0]) / 2;
			var e = (b - this.dims[1]) / 2;
			if (this.elementPositioning == "absolute") {
				if (this.options.scaleY) {
					c.top = this.originalTop - d + "px"
				}
				if (this.options.scaleX) {
					c.left = this.originalLeft - e + "px"
				}
			} else {
				if (this.options.scaleY) {
					c.top = -d + "px"
				}
				if (this.options.scaleX) {
					c.left = -e + "px"
				}
			}
		}
		this.element.setStyle(c)
	}
});
Effect.Highlight = Class.create();
Object.extend(Object.extend(Effect.Highlight.prototype, Effect.Base.prototype), {
	initialize: function (a) {
		this.element = $(a);
		if (!this.element) {
			throw Effect._elementDoesNotExistError
		}
		var b = Object.extend({
			startcolor: "#ffff99"
		}, arguments[1] || {});
		this.start(b)
	},
	setup: function () {
		if (this.element.getStyle("display") == "none") {
			this.cancel();
			return
		}
		this.oldStyle = {};
		if (!this.options.keepBackgroundImage) {
			this.oldStyle.backgroundImage = this.element.getStyle("background-image");
			this.element.setStyle({
				backgroundImage: "none"
			})
		}
		if (!this.options.endcolor) {
			this.options.endcolor = this.element.getStyle("background-color").parseColor("#ffffff")
		}
		if (!this.options.restorecolor) {
			this.options.restorecolor = this.element.getStyle("background-color")
		}
		this._base = $R(0, 2).map(function (a) {
			return parseInt(this.options.startcolor.slice(a * 2 + 1, a * 2 + 3), 16)
		}.bind(this));
		this._delta = $R(0, 2).map(function (a) {
			return parseInt(this.options.endcolor.slice(a * 2 + 1, a * 2 + 3), 16) - this._base[a]
		}.bind(this))
	},
	update: function (a) {
		this.element.setStyle({
			backgroundColor: $R(0, 2).inject("#", function (b, c, d) {
				return b + Math.round(this._base[d] + this._delta[d] * a).toColorPart()
			}.bind(this))
		})
	},
	finish: function () {
		this.element.setStyle(Object.extend(this.oldStyle, {
			backgroundColor: this.options.restorecolor
		}))
	}
});
Effect.ScrollTo = Class.create();
Object.extend(Object.extend(Effect.ScrollTo.prototype, Effect.Base.prototype), {
	initialize: function (a) {
		this.element = $(a);
		this.start(arguments[1] || {})
	},
	setup: function () {
		Position.prepare();
		var a = Position.cumulativeOffset(this.element);
		if (this.options.offset) {
			a[1] += this.options.offset
		}
		var b = window.innerHeight ? window.height - window.innerHeight : document.body.scrollHeight - (document.documentElement.clientHeight ? document.documentElement.clientHeight : document.body.clientHeight);
		this.scrollStart = Position.deltaY;
		this.delta = (a[1] > b ? b : a[1]) - this.scrollStart
	},
	update: function (a) {
		Position.prepare();
		window.scrollTo(Position.deltaX, this.scrollStart + a * this.delta)
	}
});
Effect.Fade = function (a) {
	a = $(a);
	var b = a.getInlineOpacity();
	var c = Object.extend({
		from: a.getOpacity() || 1,
		to: 0,
		afterFinishInternal: function (a) {
			if (a.options.to != 0) {
				return
			}
			a.element.hide().setStyle({
				opacity: b
			})
		}
	}, arguments[1] || {});
	return new Effect.Opacity(a, c)
};
Effect.Appear = function (a) {
	a = $(a);
	var b = Object.extend({
		from: a.getStyle("display") == "none" ? 0 : a.getOpacity() || 0,
		to: 1,
		afterFinishInternal: function (a) {
			a.element.forceRerendering()
		},
		beforeSetup: function (a) {
			a.element.setOpacity(a.options.from).show()
		}
	}, arguments[1] || {});
	return new Effect.Opacity(a, b)
};
Effect.Puff = function (a) {
	a = $(a);
	var b = {
		opacity: a.getInlineOpacity(),
		position: a.getStyle("position"),
		top: a.style.top,
		left: a.style.left,
		width: a.style.width,
		height: a.style.height
	};
	return new Effect.Parallel([new Effect.Scale(a, 200, {
		sync: true,
		scaleFromCenter: true,
		scaleContent: true,
		restoreAfterFinish: true
	}), new Effect.Opacity(a, {
		sync: true,
		to: 0
	})], Object.extend({
		duration: 1,
		beforeSetupInternal: function (a) {
			Position.absolutize(a.effects[0].element)
		},
		afterFinishInternal: function (a) {
			a.effects[0].element.hide().setStyle(b)
		}
	}, arguments[1] || {}))
};
Effect.BlindUp = function (a) {
	a = $(a);
	a.makeClipping();
	return new Effect.Scale(a, 0, Object.extend({
		scaleContent: false,
		scaleX: false,
		restoreAfterFinish: true,
		afterFinishInternal: function (a) {
			a.element.hide().undoClipping()
		}
	}, arguments[1] || {}))
};
Effect.BlindDown = function (a) {
	a = $(a);
	var b = a.getDimensions();
	return new Effect.Scale(a, 100, Object.extend({
		scaleContent: false,
		scaleX: false,
		scaleFrom: 0,
		scaleMode: {
			originalHeight: b.height,
			originalWidth: b.width
		},
		restoreAfterFinish: true,
		afterSetup: function (a) {
			a.element.makeClipping().setStyle({
				height: "0px"
			}).show()
		},
		afterFinishInternal: function (a) {
			a.element.undoClipping()
		}
	}, arguments[1] || {}))
};
Effect.SwitchOff = function (a) {
	a = $(a);
	var b = a.getInlineOpacity();
	return new Effect.Appear(a, Object.extend({
		duration: 0.4,
		from: 0,
		transition: Effect.Transitions.flicker,
		afterFinishInternal: function (a) {
			new Effect.Scale(a.element, 1, {
				duration: 0.3,
				scaleFromCenter: true,
				scaleX: false,
				scaleContent: false,
				restoreAfterFinish: true,
				beforeSetup: function (a) {
					a.element.makePositioned().makeClipping()
				},
				afterFinishInternal: function (a) {
					a.element.hide().undoClipping().undoPositioned().setStyle({
						opacity: b
					})
				}
			})
		}
	}, arguments[1] || {}))
};
Effect.DropOut = function (a) {
	a = $(a);
	var b = {
		top: a.getStyle("top"),
		left: a.getStyle("left"),
		opacity: a.getInlineOpacity()
	};
	return new Effect.Parallel([new Effect.Move(a, {
		x: 0,
		y: 100,
		sync: true
	}), new Effect.Opacity(a, {
		sync: true,
		to: 0
	})], Object.extend({
		duration: 0.5,
		beforeSetup: function (a) {
			a.effects[0].element.makePositioned()
		},
		afterFinishInternal: function (a) {
			a.effects[0].element.hide().undoPositioned().setStyle(b)
		}
	}, arguments[1] || {}))
};
Effect.Shake = function (a) {
	a = $(a);
	var b = {
		top: a.getStyle("top"),
		left: a.getStyle("left")
	};
	return new Effect.Move(a, {
		x: 20,
		y: 0,
		duration: 0.05,
		afterFinishInternal: function (a) {
			new Effect.Move(a.element, {
				x: -40,
				y: 0,
				duration: 0.1,
				afterFinishInternal: function (a) {
					new Effect.Move(a.element, {
						x: 40,
						y: 0,
						duration: 0.1,
						afterFinishInternal: function (a) {
							new Effect.Move(a.element, {
								x: -40,
								y: 0,
								duration: 0.1,
								afterFinishInternal: function (a) {
									new Effect.Move(a.element, {
										x: 40,
										y: 0,
										duration: 0.1,
										afterFinishInternal: function (a) {
											new Effect.Move(a.element, {
												x: -20,
												y: 0,
												duration: 0.05,
												afterFinishInternal: function (a) {
													a.element.undoPositioned().setStyle(b)
												}
											})
										}
									})
								}
							})
						}
					})
				}
			})
		}
	})
};
Effect.SlideDown = function (a) {
	if ($(a) == null) {
		return false
	}
	a = $(a).cleanWhitespace();
	var b = a.down().getStyle("bottom");
	var c = a.getDimensions();
	return new Effect.Scale(a, 100, Object.extend({
		scaleContent: false,
		scaleX: false,
		scaleFrom: window.opera ? 0 : 1,
		scaleMode: {
			originalHeight: c.height,
			originalWidth: c.width
		},
		restoreAfterFinish: true,
		afterSetup: function (a) {
			a.element.makePositioned();
			a.element.down().makePositioned();
			if (window.opera) {
				a.element.setStyle({
					top: ""
				})
			}
			a.element.makeClipping().setStyle({
				height: "0px"
			}).show()
		},
		afterUpdateInternal: function (a) {
			a.element.down().setStyle({
				bottom: a.dims[0] - a.element.clientHeight + "px"
			})
		},
		afterFinishInternal: function (a) {
			a.element.undoClipping().undoPositioned();
			a.element.down().undoPositioned().setStyle({
				bottom: b
			})
		}
	}, arguments[1] || {}))
};
Effect.SlideUp = function (a) {
	if ($(a) == null) {
		return false
	}
	a = $(a).cleanWhitespace();
	var b = a.down().getStyle("bottom");
	return new Effect.Scale(a, window.opera ? 0 : 1, Object.extend({
		scaleContent: false,
		scaleX: false,
		scaleMode: "box",
		scaleFrom: 100,
		restoreAfterFinish: true,
		beforeStartInternal: function (a) {
			a.element.makePositioned();
			a.element.down().makePositioned();
			if (window.opera) {
				a.element.setStyle({
					top: ""
				})
			}
			a.element.makeClipping().show()
		},
		afterUpdateInternal: function (a) {
			a.element.down().setStyle({
				bottom: a.dims[0] - a.element.clientHeight + "px"
			})
		},
		afterFinishInternal: function (a) {
			a.element.hide().undoClipping().undoPositioned().setStyle({
				bottom: b
			});
			a.element.down().undoPositioned()
		}
	}, arguments[1] || {}))
};
Effect.Squish = function (a) {
	return new Effect.Scale(a, window.opera ? 1 : 0, {
		restoreAfterFinish: true,
		beforeSetup: function (a) {
			a.element.makeClipping()
		},
		afterFinishInternal: function (a) {
			a.element.hide().undoClipping()
		}
	})
};
Effect.Grow = function (a) {
	a = $(a);
	var b = Object.extend({
		direction: "center",
		moveTransition: Effect.Transitions.sinoidal,
		scaleTransition: Effect.Transitions.sinoidal,
		opacityTransition: Effect.Transitions.full
	}, arguments[1] || {});
	var c = {
		top: a.style.top,
		left: a.style.left,
		height: a.style.height,
		width: a.style.width,
		opacity: a.getInlineOpacity()
	};
	var d = a.getDimensions();
	var e, f;
	var g, h;
	switch (b.direction) {
		case "top-left":
			e = f = g = h = 0;
			break;
		case "top-right":
			e = d.width;
			f = h = 0;
			g = -d.width;
			break;
		case "bottom-left":
			e = g = 0;
			f = d.height;
			h = -d.height;
			break;
		case "bottom-right":
			e = d.width;
			f = d.height;
			g = -d.width;
			h = -d.height;
			break;
		case "center":
			e = d.width / 2;
			f = d.height / 2;
			g = -d.width / 2;
			h = -d.height / 2;
			break
	}
	return new Effect.Move(a, {
		x: e,
		y: f,
		duration: 0.01,
		beforeSetup: function (a) {
			a.element.hide().makeClipping().makePositioned()
		},
		afterFinishInternal: function (a) {
			new Effect.Parallel([new Effect.Opacity(a.element, {
				sync: true,
				to: 1,
				from: 0,
				transition: b.opacityTransition
			}), new Effect.Move(a.element, {
				x: g,
				y: h,
				sync: true,
				transition: b.moveTransition
			}), new Effect.Scale(a.element, 100, {
				scaleMode: {
					originalHeight: d.height,
					originalWidth: d.width
				},
				sync: true,
				scaleFrom: window.opera ? 1 : 0,
				transition: b.scaleTransition,
				restoreAfterFinish: true
			})], Object.extend({
				beforeSetup: function (a) {
					a.effects[0].element.setStyle({
						height: "0px"
					}).show()
				},
				afterFinishInternal: function (a) {
					a.effects[0].element.undoClipping().undoPositioned().setStyle(c)
				}
			}, b))
		}
	})
};
Effect.Shrink = function (a) {
	a = $(a);
	var b = Object.extend({
		direction: "center",
		moveTransition: Effect.Transitions.sinoidal,
		scaleTransition: Effect.Transitions.sinoidal,
		opacityTransition: Effect.Transitions.none
	}, arguments[1] || {});
	var c = {
		top: a.style.top,
		left: a.style.left,
		height: a.style.height,
		width: a.style.width,
		opacity: a.getInlineOpacity()
	};
	var d = a.getDimensions();
	var e, f;
	switch (b.direction) {
		case "top-left":
			e = f = 0;
			break;
		case "top-right":
			e = d.width;
			f = 0;
			break;
		case "bottom-left":
			e = 0;
			f = d.height;
			break;
		case "bottom-right":
			e = d.width;
			f = d.height;
			break;
		case "center":
			e = d.width / 2;
			f = d.height / 2;
			break
	}
	return new Effect.Parallel([new Effect.Opacity(a, {
		sync: true,
		to: 0,
		from: 1,
		transition: b.opacityTransition
	}), new Effect.Scale(a, window.opera ? 1 : 0, {
		sync: true,
		transition: b.scaleTransition,
		restoreAfterFinish: true
	}), new Effect.Move(a, {
		x: e,
		y: f,
		sync: true,
		transition: b.moveTransition
	})], Object.extend({
		beforeStartInternal: function (a) {
			a.effects[0].element.makePositioned().makeClipping()
		},
		afterFinishInternal: function (a) {
			a.effects[0].element.hide().undoClipping().undoPositioned().setStyle(c)
		}
	}, b))
};
Effect.Pulsate = function (a) {
	a = $(a);
	var b = arguments[1] || {};
	var c = a.getInlineOpacity();
	var d = b.transition || Effect.Transitions.sinoidal;
	var e = function (a) {
		return d(1 - Effect.Transitions.pulse(a, b.pulses))
	};
	e.bind(d);
	return new Effect.Opacity(a, Object.extend(Object.extend({
		duration: 2,
		from: 0,
		afterFinishInternal: function (a) {
			a.element.setStyle({
				opacity: c
			})
		}
	}, b), {
		transition: e
	}))
};
Effect.Fold = function (a) {
	a = $(a);
	var b = {
		top: a.style.top,
		left: a.style.left,
		width: a.style.width,
		height: a.style.height
	};
	a.makeClipping();
	return new Effect.Scale(a, 5, Object.extend({
		scaleContent: false,
		scaleX: false,
		afterFinishInternal: function (c) {
			new Effect.Scale(a, 1, {
				scaleContent: false,
				scaleY: false,
				afterFinishInternal: function (a) {
					a.element.hide().undoClipping().setStyle(b)
				}
			})
		}
	}, arguments[1] || {}))
};
Effect.Morph = Class.create();
Object.extend(Object.extend(Effect.Morph.prototype, Effect.Base.prototype), {
	initialize: function (a) {
		this.element = $(a);
		if (!this.element) {
			throw Effect._elementDoesNotExistError
		}
		var b = Object.extend({
			style: {}
		}, arguments[1] || {});
		if (typeof b.style == "string") {
			if (b.style.indexOf(":") == -1) {
				var c = "",
					d = "." + b.style;
				$A(document.styleSheets).reverse().each(function (a) {
					if (a.cssRules) {
						cssRules = a.cssRules
					} else {
						if (a.rules) {
							cssRules = a.rules
						}
					}
					$A(cssRules).reverse().each(function (a) {
						if (d == a.selectorText) {
							c = a.style.cssText;
							throw $break
						}
					});
					if (c) {
						throw $break
					}
				});
				this.style = c.parseStyle();
				b.afterFinishInternal = function (a) {
					a.element.addClassName(a.options.style);
					a.transforms.each(function (b) {
						if (b.style != "opacity") {
							a.element.style[b.style.camelize()] = ""
						}
					})
				}
			} else {
				this.style = b.style.parseStyle()
			}
		} else {
			this.style = $H(b.style)
		}
		this.start(b)
	},
	setup: function () {
		function a(a) {
			if (!a || ["rgba(0, 0, 0, 0)", "transparent"].include(a)) {
				a = "#ffffff"
			}
			a = a.parseColor();
			return $R(0, 2).map(function (b) {
				return parseInt(a.slice(b * 2 + 1, b * 2 + 3), 16)
			})
		}
		this.transforms = this.style.map(function (b) {
			var c = b[0].underscore().dasherize(),
				d = b[1],
				e = null;
			if (d.parseColor("#zzzzzz") != "#zzzzzz") {
				d = d.parseColor();
				e = "color"
			} else {
				if (c == "opacity") {
					d = parseFloat(d);
					if (/MSIE/.test(navigator.userAgent) && !window.opera && !this.element.currentStyle.hasLayout) {
						this.element.setStyle({
							zoom: 1
						})
					}
				} else {
					if (Element.CSS_LENGTH.test(d)) {
						var f = d.match(/^([\+\-]?[0-9\.]+)(.*)$/),
							d = parseFloat(f[1]),
							e = f.length == 3 ? f[2] : null
					}
				}
			}
			var g = this.element.getStyle(c);
			return $H({
				style: c,
				originalValue: e == "color" ? a(g) : parseFloat(g || 0),
				targetValue: e == "color" ? a(d) : d,
				unit: e
			})
		}.bind(this)).reject(function (a) {
			return a.originalValue == a.targetValue || a.unit != "color" && (isNaN(a.originalValue) || isNaN(a.targetValue))
		})
	},
	update: function (a) {
		var b = $H(),
			c = null;
		this.transforms.each(function (d) {
			c = d.unit == "color" ? $R(0, 2).inject("#", function (b, c, e) {
				return b + Math.round(d.originalValue[e] + (d.targetValue[e] - d.originalValue[e]) * a).toColorPart()
			}) : d.originalValue + Math.round((d.targetValue - d.originalValue) * a * 1000) / 1000 + d.unit;
			b[d.style] = c
		});
		this.element.setStyle(b)
	}
});
Effect.Transform = Class.create();
Object.extend(Effect.Transform.prototype, {
	initialize: function (a) {
		this.tracks = [];
		this.options = arguments[1] || {};
		this.addTracks(a)
	},
	addTracks: function (a) {
		a.each(function (a) {
			var b = $H(a).values().first();
			this.tracks.push($H({
				ids: $H(a).keys().first(),
				effect: Effect.Morph,
				options: {
					style: b
				}
			}))
		}.bind(this));
		return this
	},
	play: function () {
		return new Effect.Parallel(this.tracks.map(function (a) {
			var b = [$(a.ids) || $$(a.ids)].flatten();
			return b.map(function (b) {
				return new a.effect(b, Object.extend({
					sync: true
				}, a.options))
			})
		}).flatten(), this.options)
	}
});
Element.CSS_PROPERTIES = $w("backgroundColor backgroundPosition borderBottomColor borderBottomStyle " + "borderBottomWidth borderLeftColor borderLeftStyle borderLeftWidth " + "borderRightColor borderRightStyle borderRightWidth borderSpacing " + "borderTopColor borderTopStyle borderTopWidth bottom clip color " + "fontSize fontWeight height left letterSpacing lineHeight " + "marginBottom marginLeft marginRight marginTop markerOffset maxHeight " + "maxWidth minHeight minWidth opacity outlineColor outlineOffset " + "outlineWidth paddingBottom paddingLeft paddingRight paddingTop " + "right textIndent top width wordSpacing zIndex");
Element.CSS_LENGTH = /^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/;
String.prototype.parseStyle = function () {
	var a = Element.extend(document.createElement("div"));
	a.innerHTML = '<div style="' + this + '"></div>';
	var b = a.down().style,
		c = $H();
	Element.CSS_PROPERTIES.each(function (a) {
		if (b[a]) {
			c[a] = b[a]
		}
	});
	if (/MSIE/.test(navigator.userAgent) && !window.opera && this.indexOf("opacity") > -1) {
		c.opacity = this.match(/opacity:\s*((?:0|1)?(?:\.\d*)?)/)[1]
	}
	return c
};
Element.morph = function (a, b) {
	new Effect.Morph(a, Object.extend({
		style: b
	}, arguments[2] || {}));
	return a
};
["setOpacity", "getOpacity", "getInlineOpacity", "forceRerendering", "setContentZoom", "collectTextNodes", "collectTextNodesIgnoreClass", "morph"].each(function (a) {
	Element.Methods[a] = Element[a]
});
Element.Methods.visualEffect = function (a, b, c) {
	s = b.gsub(/_/, "-").camelize();
	effect_class = s.charAt(0).toUpperCase() + s.substring(1);
	new Effect[effect_class](a, c);
	return $(a)
};
Element.addMethods();
if (typeof Effect == "undefined") {
	throw ("dragdrop.js requires including script.aculo.us' effects.js library")
}
var Droppables = {
	drops: [],
	remove: function (element) {
		this.drops = this.drops.reject(function (d) {
			return d.element == $(element)
		})
	},
	add: function (element) {
		element = $(element);
		var options = Object.extend({
			greedy: true,
			hoverclass: null,
			tree: false
		}, arguments[1] || {});
		if (options.containment) {
			options._containers = [];
			var containment = options.containment;
			if ((typeof containment == "object") && (containment.constructor == Array)) {
				containment.each(function (c) {
					options._containers.push($(c))
				})
			} else {
				options._containers.push($(containment))
			}
		}
		if (options.accept) {
			options.accept = [options.accept].flatten()
		}
		options.element = element;
		this.drops.push(options)
	},
	findDeepestChild: function (drops) {
		deepest = drops[0];
		for (i = 1; i < drops.length; ++i) {
			if (Element.isParent(drops[i].element, deepest.element)) {
				deepest = drops[i]
			}
		}
		return deepest
	},
	isContained: function (element, drop) {
		var containmentNode;
		if (drop.tree) {
			containmentNode = element.treeNode
		} else {
			containmentNode = element.parentNode
		}
		return drop._containers.detect(function (c) {
			return containmentNode == c
		})
	},
	isAffected: function (point, element, drop) {
		return ((drop.element != element) && ((!drop._containers) || this.isContained(element, drop)) && ((!drop.accept) || (Element.classNames(element).detect(function (v) {
			return drop.accept.include(v)
		}))) && Position.within(drop.element, point[0], point[1]))
	},
	deactivate: function (drop) {
		if (drop.hoverclass) {
			Element.removeClassName(drop.element, drop.hoverclass)
		}
		this.last_active = null
	},
	activate: function (drop) {
		if (drop.hoverclass) {
			Element.addClassName(drop.element, drop.hoverclass)
		}
		this.last_active = drop
	},
	show: function (point, element) {
		if (!this.drops.length) {
			return
		}
		var affected = [];
		if (this.last_active) {
			this.deactivate(this.last_active)
		}
		this.drops.each(function (drop) {
			if (Droppables.isAffected(point, element, drop)) {
				affected.push(drop)
			}
		});
		if (affected.length > 0) {
			drop = Droppables.findDeepestChild(affected);
			Position.within(drop.element, point[0], point[1]);
			if (drop.onHover) {
				drop.onHover(element, drop.element, Position.overlap(drop.overlap, drop.element))
			}
			Droppables.activate(drop)
		}
	},
	fire: function (event, element) {
		if (!this.last_active) {
			return
		}
		Position.prepare();
		if (this.isAffected([Event.pointerX(event), Event.pointerY(event)], element, this.last_active)) {
			if (this.last_active.onDrop) {
				this.last_active.onDrop(element, this.last_active.element, event)
			}
		}
	},
	reset: function () {
		if (this.last_active) {
			this.deactivate(this.last_active)
		}
	}
};
var Draggables = {
	drags: [],
	observers: [],
	register: function (draggable) {
		if (this.drags.length == 0) {
			this.eventMouseUp = this.endDrag.bindAsEventListener(this);
			this.eventMouseMove = this.updateDrag.bindAsEventListener(this);
			this.eventKeypress = this.keyPress.bindAsEventListener(this);
			Event.observe(document, "mouseup", this.eventMouseUp);
			Event.observe(document, "mousemove", this.eventMouseMove);
			Event.observe(document, "keypress", this.eventKeypress)
		}
		this.drags.push(draggable)
	},
	unregister: function (draggable) {
		this.drags = this.drags.reject(function (d) {
			return d == draggable
		});
		if (this.drags.length == 0) {
			Event.stopObserving(document, "mouseup", this.eventMouseUp);
			Event.stopObserving(document, "mousemove", this.eventMouseMove);
			Event.stopObserving(document, "keypress", this.eventKeypress)
		}
	},
	activate: function (draggable) {
		if (draggable.options.delay) {
			this._timeout = setTimeout(function () {
				Draggables._timeout = null;
				window.focus();
				Draggables.activeDraggable = draggable
			}.bind(this), draggable.options.delay)
		} else {
			window.focus();
			this.activeDraggable = draggable
		}
	},
	deactivate: function () {
		this.activeDraggable = null
	},
	updateDrag: function (event) {
		if (!this.activeDraggable) {
			return
		}
		var pointer = [Event.pointerX(event), Event.pointerY(event)];
		if (this._lastPointer && (this._lastPointer.inspect() == pointer.inspect())) {
			return
		}
		this._lastPointer = pointer;
		this.activeDraggable.updateDrag(event, pointer)
	},
	endDrag: function (event) {
		if (this._timeout) {
			clearTimeout(this._timeout);
			this._timeout = null
		}
		if (!this.activeDraggable) {
			return
		}
		this._lastPointer = null;
		this.activeDraggable.endDrag(event);
		this.activeDraggable = null
	},
	keyPress: function (event) {
		if (this.activeDraggable) {
			this.activeDraggable.keyPress(event)
		}
	},
	addObserver: function (observer) {
		this.observers.push(observer);
		this._cacheObserverCallbacks()
	},
	removeObserver: function (element) {
		this.observers = this.observers.reject(function (o) {
			return o.element == element
		});
		this._cacheObserverCallbacks()
	},
	notify: function (eventName, draggable, event) {
		if (this[eventName + "Count"] > 0) {
			this.observers.each(function (o) {
				if (o[eventName]) {
					o[eventName](eventName, draggable, event)
				}
			})
		}
		if (draggable.options[eventName]) {
			draggable.options[eventName](draggable, event)
		}
	},
	_cacheObserverCallbacks: function () {
		["onStart", "onEnd", "onDrag"].each(function (eventName) {
			Draggables[eventName + "Count"] = Draggables.observers.select(function (o) {
				return o[eventName]
			}).length
		})
	}
};
var Draggable = Class.create();
Draggable._dragging = {};
Draggable.prototype = {
	initialize: function (element) {
		var defaults = {
			handle: false,
			reverteffect: function (element, top_offset, left_offset) {
				var dur = Math.sqrt(Math.abs(top_offset ^ 2) + Math.abs(left_offset ^ 2)) * 0.02;
				new Effect.Move(element, {
					x: -left_offset,
					y: -top_offset,
					duration: dur,
					queue: {
						scope: "_draggable",
						position: "end"
					}
				})
			},
			endeffect: function (element) {
				var toOpacity = typeof element._opacity == "number" ? element._opacity : 1;
				new Effect.Opacity(element, {
					duration: 0.2,
					from: 0.7,
					to: toOpacity,
					queue: {
						scope: "_draggable",
						position: "end"
					},
					afterFinish: function () {
						Draggable._dragging[element] = false
					}
				})
			},
			zindex: 1000,
			revert: false,
			scroll: false,
			scrollSensitivity: 20,
			scrollSpeed: 15,
			snap: false,
			delay: 0
		};
		if (!arguments[1] || typeof arguments[1].endeffect == "undefined") {
			Object.extend(defaults, {
				starteffect: function (element) {
					element._opacity = Element.getOpacity(element);
					Draggable._dragging[element] = true;
					new Effect.Opacity(element, {
						duration: 0.2,
						from: element._opacity,
						to: 0.7
					})
				}
			})
		}
		var options = Object.extend(defaults, arguments[1] || {});
		this.element = $(element);
		if (options.handle && (typeof options.handle == "string")) {
			this.handle = this.element.down("." + options.handle, 0)
		}
		if (!this.handle) {
			this.handle = $(options.handle)
		}
		if (!this.handle) {
			this.handle = this.element
		}
		if (options.scroll && !options.scroll.scrollTo && !options.scroll.outerHTML) {
			options.scroll = $(options.scroll);
			this._isScrollChild = Element.childOf(this.element, options.scroll)
		}
		Element.makePositioned(this.element);
		this.delta = this.currentDelta();
		this.options = options;
		this.dragging = false;
		this.eventMouseDown = this.initDrag.bindAsEventListener(this);
		Event.observe(this.handle, "mousedown", this.eventMouseDown);
		Draggables.register(this)
	},
	destroy: function () {
		Event.stopObserving(this.handle, "mousedown", this.eventMouseDown);
		Draggables.unregister(this)
	},
	currentDelta: function () {
		return ([parseInt(Element.getStyle(this.element, "left") || "0"), parseInt(Element.getStyle(this.element, "top") || "0")])
	},
	initDrag: function (event) {
		if (typeof Draggable._dragging[this.element] != "undefined" && Draggable._dragging[this.element]) {
			return
		}
		if (Event.isLeftClick(event)) {
			var src = Event.element(event);
			if ((tag_name = src.tagName.toUpperCase()) && (tag_name == "INPUT" || tag_name == "SELECT" || tag_name == "OPTION" || tag_name == "BUTTON" || tag_name == "TEXTAREA")) {
				return
			}
			var pointer = [Event.pointerX(event), Event.pointerY(event)];
			var pos = Position.cumulativeOffset(this.element);
			this.offset = [0, 1].map(function (i) {
				return (pointer[i] - pos[i])
			});
			Draggables.activate(this);
			Event.stop(event)
		}
	},
	startDrag: function (event) {
		this.dragging = true;
		if (this.options.zindex) {
			this.originalZ = parseInt(Element.getStyle(this.element, "z-index") || 0);
			this.element.style.zIndex = this.options.zindex
		}
		if (this.options.ghosting) {
			this._clone = this.element.cloneNode(true);
			Position.absolutize(this.element);
			this.element.parentNode.insertBefore(this._clone, this.element)
		}
		if (this.options.scroll) {
			if (this.options.scroll == window) {
				var where = this._getWindowScroll(this.options.scroll);
				this.originalScrollLeft = where.left;
				this.originalScrollTop = where.top
			} else {
				this.originalScrollLeft = this.options.scroll.scrollLeft;
				this.originalScrollTop = this.options.scroll.scrollTop
			}
		}
		Draggables.notify("onStart", this, event);
		if (this.options.starteffect) {
			this.options.starteffect(this.element)
		}
	},
	updateDrag: function (event, pointer) {
		if (!this.dragging) {
			this.startDrag(event)
		}
		Position.prepare();
		Droppables.show(pointer, this.element);
		Draggables.notify("onDrag", this, event);
		this.draw(pointer);
		if (this.options.change) {
			this.options.change(this)
		}
		if (this.options.scroll) {
			this.stopScrolling();
			var p;
			if (this.options.scroll == window) {
				with(this._getWindowScroll(this.options.scroll)) {
					p = [left, top, left + width, top + height]
				}
			} else {
				p = Position.page(this.options.scroll);
				p[0] += this.options.scroll.scrollLeft + Position.deltaX;
				p[1] += this.options.scroll.scrollTop + Position.deltaY;
				p.push(p[0] + this.options.scroll.offsetWidth);
				p.push(p[1] + this.options.scroll.offsetHeight)
			}
			var speed = [0, 0];
			if (pointer[0] < (p[0] + this.options.scrollSensitivity)) {
				speed[0] = pointer[0] - (p[0] + this.options.scrollSensitivity)
			}
			if (pointer[1] < (p[1] + this.options.scrollSensitivity)) {
				speed[1] = pointer[1] - (p[1] + this.options.scrollSensitivity)
			}
			if (pointer[0] > (p[2] - this.options.scrollSensitivity)) {
				speed[0] = pointer[0] - (p[2] - this.options.scrollSensitivity)
			}
			if (pointer[1] > (p[3] - this.options.scrollSensitivity)) {
				speed[1] = pointer[1] - (p[3] - this.options.scrollSensitivity)
			}
			this.startScrolling(speed)
		}
		if (navigator.appVersion.indexOf("AppleWebKit") > 0) {
			window.scrollBy(0, 0)
		}
		Event.stop(event)
	},
	finishDrag: function (event, success) {
		this.dragging = false;
		if (this.options.ghosting) {
			Position.relativize(this.element);
			Element.remove(this._clone);
			this._clone = null
		}
		if (success) {
			Droppables.fire(event, this.element)
		}
		Draggables.notify("onEnd", this, event);
		var revert = this.options.revert;
		if (revert && typeof revert == "function") {
			revert = revert(this.element)
		}
		var d = this.currentDelta();
		if (revert && this.options.reverteffect) {
			this.options.reverteffect(this.element, d[1] - this.delta[1], d[0] - this.delta[0])
		} else {
			this.delta = d
		}
		if (this.options.zindex) {
			this.element.style.zIndex = this.originalZ
		}
		if (this.options.endeffect) {
			this.options.endeffect(this.element)
		}
		Draggables.deactivate(this);
		Droppables.reset()
	},
	keyPress: function (event) {
		if (event.keyCode != Event.KEY_ESC) {
			return
		}
		this.finishDrag(event, false);
		Event.stop(event)
	},
	endDrag: function (event) {
		if (!this.dragging) {
			return
		}
		this.stopScrolling();
		this.finishDrag(event, true);
		Event.stop(event)
	},
	draw: function (point) {
		var pos = Position.cumulativeOffset(this.element);
		if (this.options.ghosting) {
			var r = Position.realOffset(this.element);
			pos[0] += r[0] - Position.deltaX;
			pos[1] += r[1] - Position.deltaY
		}
		var d = this.currentDelta();
		pos[0] -= d[0];
		pos[1] -= d[1];
		if (this.options.scroll && (this.options.scroll != window && this._isScrollChild)) {
			pos[0] -= this.options.scroll.scrollLeft - this.originalScrollLeft;
			pos[1] -= this.options.scroll.scrollTop - this.originalScrollTop
		}
		var p = [0, 1].map(function (i) {
			return (point[i] - pos[i] - this.offset[i])
		}.bind(this));
		if (this.options.snap) {
			if (typeof this.options.snap == "function") {
				p = this.options.snap(p[0], p[1], this)
			} else {
				if (this.options.snap instanceof Array) {
					p = p.map(function (v, i) {
						return Math.round(v / this.options.snap[i]) * this.options.snap[i]
					}.bind(this))
				} else {
					p = p.map(function (v) {
						return Math.round(v / this.options.snap) * this.options.snap
					}.bind(this))
				}
			}
		}
		var style = this.element.style;
		if ((!this.options.constraint) || (this.options.constraint == "horizontal")) {
			style.left = p[0] + "px"
		}
		if ((!this.options.constraint) || (this.options.constraint == "vertical")) {
			style.top = p[1] + "px"
		}
		if (style.visibility == "hidden") {
			style.visibility = ""
		}
	},
	stopScrolling: function () {
		if (this.scrollInterval) {
			clearInterval(this.scrollInterval);
			this.scrollInterval = null;
			Draggables._lastScrollPointer = null
		}
	},
	startScrolling: function (speed) {
		if (!(speed[0] || speed[1])) {
			return
		}
		this.scrollSpeed = [speed[0] * this.options.scrollSpeed, speed[1] * this.options.scrollSpeed];
		this.lastScrolled = new Date();
		this.scrollInterval = setInterval(this.scroll.bind(this), 10)
	},
	scroll: function () {
		var current = new Date();
		var delta = current - this.lastScrolled;
		this.lastScrolled = current;
		if (this.options.scroll == window) {
			with(this._getWindowScroll(this.options.scroll)) {
				if (this.scrollSpeed[0] || this.scrollSpeed[1]) {
					var d = delta / 1000;
					this.options.scroll.scrollTo(left + d * this.scrollSpeed[0], top + d * this.scrollSpeed[1])
				}
			}
		} else {
			this.options.scroll.scrollLeft += this.scrollSpeed[0] * delta / 1000;
			this.options.scroll.scrollTop += this.scrollSpeed[1] * delta / 1000
		}
		Position.prepare();
		Droppables.show(Draggables._lastPointer, this.element);
		Draggables.notify("onDrag", this);
		if (this._isScrollChild) {
			Draggables._lastScrollPointer = Draggables._lastScrollPointer || $A(Draggables._lastPointer);
			Draggables._lastScrollPointer[0] += this.scrollSpeed[0] * delta / 1000;
			Draggables._lastScrollPointer[1] += this.scrollSpeed[1] * delta / 1000;
			if (Draggables._lastScrollPointer[0] < 0) {
				Draggables._lastScrollPointer[0] = 0
			}
			if (Draggables._lastScrollPointer[1] < 0) {
				Draggables._lastScrollPointer[1] = 0
			}
			this.draw(Draggables._lastScrollPointer)
		}
		if (this.options.change) {
			this.options.change(this)
		}
	},
	_getWindowScroll: function (w) {
		var T, L, W, H;
		with(w.document) {
			if (w.document.documentElement && documentElement.scrollTop) {
				T = documentElement.scrollTop;
				L = documentElement.scrollLeft
			} else {
				if (w.document.body) {
					T = body.scrollTop;
					L = body.scrollLeft
				}
			}
			if (w.innerWidth) {
				W = w.innerWidth;
				H = w.innerHeight
			} else {
				if (w.document.documentElement && documentElement.clientWidth) {
					W = documentElement.clientWidth;
					H = documentElement.clientHeight
				} else {
					W = body.offsetWidth;
					H = body.offsetHeight
				}
			}
		}
		return {
			top: T,
			left: L,
			width: W,
			height: H
		}
	}
};
var SortableObserver = Class.create();
SortableObserver.prototype = {
	initialize: function (element, observer) {
		this.element = $(element);
		this.observer = observer;
		this.lastValue = Sortable.serialize(this.element)
	},
	onStart: function () {
		this.lastValue = Sortable.serialize(this.element)
	},
	onEnd: function () {
		Sortable.unmark();
		if (this.lastValue != Sortable.serialize(this.element)) {
			this.observer(this.element)
		}
	}
};
var Sortable = {
	SERIALIZE_RULE: /^[^_\-](?:[A-Za-z0-9\-\_]*)[_](.*)$/,
	sortables: {},
	_findRootElement: function (element) {
		while (element.tagName.toUpperCase() != "BODY") {
			if (element.id && Sortable.sortables[element.id]) {
				return element
			}
			element = element.parentNode
		}
	},
	options: function (element) {
		element = Sortable._findRootElement($(element));
		if (!element) {
			return
		}
		return Sortable.sortables[element.id]
	},
	destroy: function (element) {
		var s = Sortable.options(element);
		if (s) {
			Draggables.removeObserver(s.element);
			s.droppables.each(function (d) {
				Droppables.remove(d)
			});
			s.draggables.invoke("destroy");
			delete Sortable.sortables[s.element.id]
		}
	},
	create: function (element) {
		element = $(element);
		var options = Object.extend({
			element: element,
			tag: "li",
			dropOnEmpty: false,
			tree: false,
			treeTag: "ul",
			overlap: "vertical",
			constraint: "vertical",
			containment: element,
			handle: false,
			only: false,
			delay: 0,
			hoverclass: null,
			ghosting: false,
			scroll: false,
			scrollSensitivity: 20,
			scrollSpeed: 15,
			format: this.SERIALIZE_RULE,
			onChange: Prototype.emptyFunction,
			onUpdate: Prototype.emptyFunction
		}, arguments[1] || {});
		this.destroy(element);
		var options_for_draggable = {
			revert: true,
			scroll: options.scroll,
			scrollSpeed: options.scrollSpeed,
			scrollSensitivity: options.scrollSensitivity,
			delay: options.delay,
			ghosting: options.ghosting,
			constraint: options.constraint,
			handle: options.handle
		};
		if (options.starteffect) {
			options_for_draggable.starteffect = options.starteffect
		}
		if (options.reverteffect) {
			options_for_draggable.reverteffect = options.reverteffect
		} else {
			if (options.ghosting) {
				options_for_draggable.reverteffect = function (element) {
					element.style.top = 0;
					element.style.left = 0
				}
			}
		}
		if (options.endeffect) {
			options_for_draggable.endeffect = options.endeffect
		}
		if (options.zindex) {
			options_for_draggable.zindex = options.zindex
		}
		var options_for_droppable = {
			overlap: options.overlap,
			containment: options.containment,
			tree: options.tree,
			hoverclass: options.hoverclass,
			onHover: Sortable.onHover
		};
		var options_for_tree = {
			onHover: Sortable.onEmptyHover,
			overlap: options.overlap,
			containment: options.containment,
			hoverclass: options.hoverclass
		};
		Element.cleanWhitespace(element);
		options.draggables = [];
		options.droppables = [];
		if (options.dropOnEmpty || options.tree) {
			Droppables.add(element, options_for_tree);
			options.droppables.push(element)
		}(this.findElements(element, options) || []).each(function (e) {
			var handle = options.handle ? $(e).down("." + options.handle, 0) : e;
			options.draggables.push(new Draggable(e, Object.extend(options_for_draggable, {
				handle: handle
			})));
			Droppables.add(e, options_for_droppable);
			if (options.tree) {
				e.treeNode = element
			}
			options.droppables.push(e)
		});
		if (options.tree) {
			(Sortable.findTreeElements(element, options) || []).each(function (e) {
				Droppables.add(e, options_for_tree);
				e.treeNode = element;
				options.droppables.push(e)
			})
		}
		this.sortables[element.id] = options;
		Draggables.addObserver(new SortableObserver(element, options.onUpdate))
	},
	findElements: function (element, options) {
		return Element.findChildren(element, options.only, options.tree ? true : false, options.tag)
	},
	findTreeElements: function (element, options) {
		return Element.findChildren(element, options.only, options.tree ? true : false, options.treeTag)
	},
	onHover: function (element, dropon, overlap) {
		if (Element.isParent(dropon, element)) {
			return
		}
		if (overlap > 0.33 && overlap < 0.66 && Sortable.options(dropon).tree) {
			return
		} else {
			if (overlap > 0.5) {
				Sortable.mark(dropon, "before");
				if (dropon.previousSibling != element) {
					var oldParentNode = element.parentNode;
					element.style.visibility = "hidden";
					dropon.parentNode.insertBefore(element, dropon);
					if (dropon.parentNode != oldParentNode) {
						Sortable.options(oldParentNode).onChange(element)
					}
					Sortable.options(dropon.parentNode).onChange(element)
				}
			} else {
				Sortable.mark(dropon, "after");
				var nextElement = dropon.nextSibling || null;
				if (nextElement != element) {
					var oldParentNode = element.parentNode;
					element.style.visibility = "hidden";
					dropon.parentNode.insertBefore(element, nextElement);
					if (dropon.parentNode != oldParentNode) {
						Sortable.options(oldParentNode).onChange(element)
					}
					Sortable.options(dropon.parentNode).onChange(element)
				}
			}
		}
	},
	onEmptyHover: function (element, dropon, overlap) {
		var oldParentNode = element.parentNode;
		var droponOptions = Sortable.options(dropon);
		if (!Element.isParent(dropon, element)) {
			var index;
			var children = Sortable.findElements(dropon, {
				tag: droponOptions.tag,
				only: droponOptions.only
			});
			var child = null;
			if (children) {
				var offset = Element.offsetSize(dropon, droponOptions.overlap) * (1 - overlap);
				for (index = 0; index < children.length; index += 1) {
					if (offset - Element.offsetSize(children[index], droponOptions.overlap) >= 0) {
						offset -= Element.offsetSize(children[index], droponOptions.overlap)
					} else {
						if (offset - (Element.offsetSize(children[index], droponOptions.overlap) / 2) >= 0) {
							child = index + 1 < children.length ? children[index + 1] : null;
							break
						} else {
							child = children[index];
							break
						}
					}
				}
			}
			dropon.insertBefore(element, child);
			Sortable.options(oldParentNode).onChange(element);
			droponOptions.onChange(element)
		}
	},
	unmark: function () {
		if (Sortable._marker) {
			Sortable._marker.hide()
		}
	},
	mark: function (dropon, position) {
		var sortable = Sortable.options(dropon.parentNode);
		if (sortable && !sortable.ghosting) {
			return
		}
		if (!Sortable._marker) {
			Sortable._marker = ($("dropmarker") || Element.extend(document.createElement("DIV"))).hide().addClassName("dropmarker").setStyle({
				position: "absolute"
			});
			document.getElementsByTagName("body").item(0).appendChild(Sortable._marker)
		}
		var offsets = Position.cumulativeOffset(dropon);
		Sortable._marker.setStyle({
			left: offsets[0] + "px",
			top: offsets[1] + "px"
		});
		if (position == "after") {
			if (sortable.overlap == "horizontal") {
				Sortable._marker.setStyle({
					left: (offsets[0] + dropon.clientWidth) + "px"
				})
			} else {
				Sortable._marker.setStyle({
					top: (offsets[1] + dropon.clientHeight) + "px"
				})
			}
		}
		Sortable._marker.show()
	},
	_tree: function (element, options, parent) {
		var children = Sortable.findElements(element, options) || [];
		for (var i = 0; i < children.length; ++i) {
			var match = children[i].id.match(options.format);
			if (!match) {
				continue
			}
			var child = {
				id: encodeURIComponent(match ? match[1] : null),
				element: element,
				parent: parent,
				children: [],
				position: parent.children.length,
				container: $(children[i]).down(options.treeTag)
			};
			if (child.container) {
				this._tree(child.container, options, child)
			}
			parent.children.push(child)
		}
		return parent
	},
	tree: function (element) {
		element = $(element);
		var sortableOptions = this.options(element);
		var options = Object.extend({
			tag: sortableOptions.tag,
			treeTag: sortableOptions.treeTag,
			only: sortableOptions.only,
			name: element.id,
			format: sortableOptions.format
		}, arguments[1] || {});
		var root = {
			id: null,
			parent: null,
			children: [],
			container: element,
			position: 0
		};
		return Sortable._tree(element, options, root)
	},
	_constructIndex: function (node) {
		var index = "";
		do {
			if (node.id) {
				index = "[" + node.position + "]" + index
			}
		} while ((node = node.parent) != null);
		return index
	},
	sequence: function (element) {
		element = $(element);
		var options = Object.extend(this.options(element), arguments[1] || {});
		return $(this.findElements(element, options) || []).map(function (item) {
			return item.id.match(options.format) ? item.id.match(options.format)[1] : ""
		})
	},
	setSequence: function (element, new_sequence) {
		element = $(element);
		var options = Object.extend(this.options(element), arguments[2] || {});
		var nodeMap = {};
		this.findElements(element, options).each(function (n) {
			if (n.id.match(options.format)) {
				nodeMap[n.id.match(options.format)[1]] = [n, n.parentNode]
			}
			n.parentNode.removeChild(n)
		});
		new_sequence.each(function (ident) {
			var n = nodeMap[ident];
			if (n) {
				n[1].appendChild(n[0]);
				delete nodeMap[ident]
			}
		})
	},
	serialize: function (element) {
		element = $(element);
		var options = Object.extend(Sortable.options(element), arguments[1] || {});
		var name = encodeURIComponent((arguments[1] && arguments[1].name) ? arguments[1].name : element.id);
		if (options.tree) {
			return Sortable.tree(element, arguments[1]).children.map(function (item) {
				return [name + Sortable._constructIndex(item) + "[id]=" + encodeURIComponent(item.id)].concat(item.children.map(arguments.callee))
			}).flatten().join("&")
		} else {
			return Sortable.sequence(element, arguments[1]).map(function (item) {
				return name + "[]=" + encodeURIComponent(item)
			}).join("&")
		}
	}
};
Element.isParent = function (child, element) {
	if (!child.parentNode || child == element) {
		return false
	}
	if (child.parentNode == element) {
		return true
	}
	return Element.isParent(child.parentNode, element)
};
Element.findChildren = function (element, only, recursive, tagName) {
	if (!element.hasChildNodes()) {
		return null
	}
	tagName = tagName.toUpperCase();
	if (only) {
		only = [only].flatten()
	}
	var elements = [];
	$A(element.childNodes).each(function (e) {
		if (e.tagName && e.tagName.toUpperCase() == tagName && (!only || (Element.classNames(e).detect(function (v) {
				return only.include(v)
			})))) {
			elements.push(e)
		}
		if (recursive) {
			var grandchildren = Element.findChildren(e, only, recursive, tagName);
			if (grandchildren) {
				elements.push(grandchildren)
			}
		}
	});
	return (elements.length > 0 ? elements.flatten() : [])
};
Element.offsetSize = function (element, type) {
	return element["offset" + ((type == "vertical" || type == "height") ? "Height" : "Width")]
};

function validator(a, b, c) {
	return this.f_error = validator_error, this.f_alert = c && c.alert ? function (a) {
		return alert(a), !1
	} : function () {
		return !1
	}, a ? (this.s_form = a, b && "object" == typeof b ? (this.a_fields = b, this.a_2disable = c && c.to_disable && "object" == typeof c.to_disable ? c.to_disable : [], void(this.exec = validator_exec)) : this.f_alert(this.f_error(1))) : this.f_alert(this.f_error(0))
}

function validator_exec() {
	var o_form = document.forms[this.s_form];
	if (!o_form) {
		return this.f_alert(this.f_error(2))
	}
	b_dom = document.body && document.body.innerHTML;
	for (var n_key in this.a_fields) {
		if (this.a_fields[n_key].n = n_key, !this.a_fields[n_key].l) {
			return this.f_alert(this.f_error(3, this.a_fields[n_key]))
		}
		if (o_input = o_form.elements[n_key], !o_input) {
			return this.f_alert(this.f_error(4, this.a_fields[n_key]))
		}
		this.a_fields[n_key].o_input = o_input
	}
	if (b_dom) {
		for (var n_key in this.a_fields) {
			if (this.a_fields[n_key].t) {
				var s_labeltag = this.a_fields[n_key].t,
					e_labeltag = get_element(s_labeltag);
				if (!e_labeltag) {
					return this.f_alert(this.f_error(5, this.a_fields[n_key]))
				}
				this.a_fields[n_key].o_tag = e_labeltag
			}
		}
	}
	for (var n_key in this.a_fields) {
		var s_value = "";
		if (o_input = this.a_fields[n_key].o_input, "checkbox" == o_input.type) {
			s_value = o_input.checked ? o_input.value : ""
		} else {
			if (o_input.value) {
				s_value = o_input.value
			} else {
				if (o_input.options) {
					s_value = o_input.selectedIndex > -1 ? o_input.options[o_input.selectedIndex].value : null
				} else {
					if (o_input.length > 0) {
						for (var n_index = 0; n_index < o_input.length; n_index++) {
							if (o_input[n_index].checked) {
								s_value = o_input[n_index].value;
								break
							}
						}
					}
				}
			}
		}
		this.a_fields[n_key].v = s_value.replace(/(^\s+)|(\s+$)/g, "")
	}
	var n_errors_count = 0,
		n_another, o_format_check;
	for (var n_key in this.a_fields) {
		if (o_format_check = this.a_fields[n_key].f && a_formats[this.a_fields[n_key].f] ? a_formats[this.a_fields[n_key].f] : null, this.a_fields[n_key].n_error = null, this.a_fields[n_key].r && !this.a_fields[n_key].v) {
			this.a_fields[n_key].n_error = 1, n_errors_count++
		} else {
			if (this.a_fields[n_key].mn && "" != this.a_fields[n_key].v && String(this.a_fields[n_key].v).length < this.a_fields[n_key].mn) {
				this.a_fields[n_key].n_error = 2, n_errors_count++
			} else {
				if (this.a_fields[n_key].mx && String(this.a_fields[n_key].v).length > this.a_fields[n_key].mx) {
					this.a_fields[n_key].n_error = 3, n_errors_count++
				} else {
					if (this.a_fields[n_key].v && this.a_fields[n_key].f && ("function" == typeof o_format_check && !o_format_check(this.a_fields[n_key].v) || "function" != typeof o_format_check && null != o_format_check && !o_format_check.test(this.a_fields[n_key].v))) {
						"alphanum" == this.a_fields[n_key].f ? this.a_fields[n_key].n_error = 6 : this.a_fields[n_key].n_error = 4, n_errors_count++
					} else {
						if (this.a_fields[n_key].m) {
							for (var n_key2 in this.a_fields) {
								if (n_key2 == this.a_fields[n_key].m) {
									n_another = n_key2;
									break
								}
							}
							if (null == n_another) {
								return this.f_alert(this.f_error(6, this.a_fields[n_key]))
							}
							this.a_fields[n_another].v != this.a_fields[n_key].v && (this.a_fields[n_key].ml = this.a_fields[n_another].l, this.a_fields[n_key].n_error = 5, n_errors_count++)
						}
					}
				}
			}
		}
	}
	var s_alert_message = "",
		e_first_error;
	if (n_errors_count) {
		for (var n_key in this.a_fields) {
			var n_error_type = this.a_fields[n_key].n_error,
				s_message = "";
			n_error_type && (s_message = this.f_error(n_error_type + 6, this.a_fields[n_key])), s_message && (e_first_error || (e_first_error = o_form.elements[n_key]), s_alert_message += s_message + "\n", b_dom && this.a_fields[n_key].o_tag && jQuery(this.a_fields[n_key].o_tag).addClass("red-highlight"))
		}
		return alert(s_alert_message), e_first_error.focus && "hidden" != e_first_error.type && !e_first_error.disabled && eval("e_first_error.focus()"), !1
	}
	for (n_key in this.a_2disable) {
		o_form.elements[this.a_2disable[n_key]] && (o_form.elements[this.a_2disable[n_key]].disabled = !0)
	}
	return !0
}

function validator_error(a) {
	for (var d, b = a_messages[a], c = 1; c < arguments.length; c++) {
		for (d in arguments[c]) {
			b = b.replace("%" + d + "%", arguments[c][d])
		}
	}
	return b = b.replace("%form%", this.s_form)
}

function get_element(a) {
	return document.all ? document.all[a] : document.getElementById ? document.getElementById(a) : null
}
var re_dt = /^(\d{1,2})\-(\d{1,2})\-(\d{4})$/,
	re_tm = /^(\d{1,2})\:(\d{1,2})\:(\d{1,2})$/,
	a_formats = {
		membername: /^[a-zA-Z0-9\.\-\@\_]*$/,
		alpha: /^[a-zA-Z\.\-]*$/,
		alphanum: /^[a-zA-Z0-9]+$/,
		unsigned: /^\d+$/,
		integer: /^[\+\-]?\d*$/,
		real: /^[\+\-]?\d*\.?\d*$/,
		email: /^[\w-\.]+\@[\w\.-]+\.[a-z]{2,8}$/,
		phone: /^[\d\.\s\-]+$/,
		date: function (a) {
			if (!re_dt.test(a)) {
				return !1
			}
			if (RegExp.$1 > 31 || RegExp.$2 > 12) {
				return !1
			}
			var b = new Date(RegExp.$3, Number(RegExp.$2 - 1), RegExp.$1);
			return b.getMonth() == Number(RegExp.$2 - 1)
		},
		time: function (a) {
			return !!re_tm.test(a) && !(RegExp.$1 > 23 || RegExp.$2 > 59 || RegExp.$3 > 59)
		}
	},
	a_messages = ["No form name passed to validator construction routine", 'No array of "%form%" form fields passed to validator construction routine', 'Form "%form%" can not be found in this document', 'Incomplete "%n%" form field descriptor entry. "l" attribute is missing', 'Can not find form field "%n%" in the form "%form%"', 'Can not find label tag (id="%t%")', 'Can not verify match. Field "%m%" was not found', 'LÃ¼tfen "%l%" alanÄ±nÄ± boÅŸ bÄ±rakmayÄ±nÄ±z.', '"%l%" alanÄ±nda en az %mn% karakter olmalÄ±dÄ±r.', '"%l%" alanÄ±nÄ±n deÄŸeri %mx% karakterden fazla olamaz.', '"%l%" alanÄ±nÄ±n deÄŸeri "%v%" olamaz.', '"%l%" ile  "%ml%" aynÄ± olmalÄ±dÄ±r.', '"%l%" alanÄ± yalnÄ±zca harf ve rakamlardan oluÅŸmalÄ±dÄ±r.'];
jQuery.fn.tooltip = function (options) {
	var options = jQuery.extend({
		tooltipID: 'div[id="tooltip"]'
	}, options);
	return jQuery(this).each(function () {
		jQuery(this).bind({
			mouseover: function () {
				var array = jQuery(this).attr("class").split(" ");
				if (jQuery.inArray("tooltipForm", array) > -1) {
					var tooltipContent = jQuery(this).attr("rel");
					jQuery("body").append('<div id="tooltip" class="notification question">' + tooltipContent + "</div>");
					var offset = jQuery(this).offset();
					var browserWidth = document.documentElement.offsetWidth;
					var tooltipWidth = jQuery(options.tooltipID).innerWidth();
					if (parseInt(offset.left + tooltipWidth + 20) > browserWidth) {
						jQuery(options.tooltipID).css({
							"top": "" + (offset.top) + "px",
							"right": "" + ((parseInt(browserWidth - offset.left)) + 8) + "px"
						})
					} else {
						jQuery(options.tooltipID).css({
							"top": "" + (offset.top) + "px",
							"left": "" + (parseInt(offset.left) + 20) + "px"
						})
					}
				} else {
					if (jQuery.inArray("tooltipGeneral", array) > -1) {
						var tooltipContent = jQuery(this).attr("rel");
						jQuery("body").append('<div id="tooltip" class="tooltipGeneralStyle">' + tooltipContent + "</div>");
						var offset = jQuery(this).offset();
						var browserWidth = document.documentElement.offsetWidth;
						var tooltipWidth = jQuery(options.tooltipID).innerWidth();
						var tooltipHeight = jQuery(options.tooltipID).innerHeight();
						if (parseInt(offset.left + tooltipWidth + 20) > browserWidth) {
							jQuery(options.tooltipID).css({
								"top": "" + (offset.top) + "px",
								"right": "" + ((parseInt(browserWidth - offset.left)) + 7) + "px"
							})
						} else {
							jQuery(options.tooltipID).css({
								"top": "" + (offset.top) + "px",
								"left": "" + (parseInt(offset.left) - tooltipWidth - 8) + "px"
							})
						}
					} else {
						if (jQuery.inArray("tooltipImage", array) > -1) {
							var tooltipContent = jQuery(this).attr("rel");
							jQuery("body").append('<div id="tooltip" class="tooltipImageStyle"><img src="' + tooltipContent + '" alt=""></div>');
							var offset = jQuery(this).offset();
							var tooltipButtonWidth = jQuery(this).outerWidth();
							var tooltipButtonHeight = jQuery(this).outerHeight();
							var browserWidth = document.documentElement.offsetWidth;
							var tooltipWidth = jQuery(options.tooltipID).innerWidth();
							var tooltipHeight = jQuery(options.tooltipID).innerHeight();
							if (parseInt(offset.left + tooltipWidth + 20) > browserWidth) {
								jQuery(options.tooltipID).css({
									"top": "" + (offset.top) + "px",
									"right": "" + ((parseInt(browserWidth - offset.left)) + 8) + "px"
								})
							} else {
								jQuery(options.tooltipID).css({
									"top": "" + (offset.top + tooltipButtonHeight) + "px",
									"left": "" + (parseInt(offset.left) + tooltipButtonWidth + 15) + "px"
								})
							}
						} else {
							if (jQuery.inArray("tooltipUserImage", array) > -1) {
								var tooltipContent = jQuery(this).attr("rel");
								jQuery("body").append('<div id="tooltip" class="tooltipUserImageStyle"><img src="' + tooltipContent + '" alt=""></div>');
								var tooltipButtonWidth = jQuery(this).outerWidth();
								var tooltipButtonHeight = jQuery(this).outerHeight();
								var browserWidth = document.documentElement.offsetWidth;
								var tooltipWidth = jQuery(options.tooltipID).innerWidth();
								var tooltipHeight = jQuery(options.tooltipID).innerHeight();
								jQuery(this).mousemove(function (e) {
									if (parseInt(e.pageX + tooltipWidth) > browserWidth) {
										jQuery(options.tooltipID).css({
											"top": "" + (e.pageY) + "px",
											"right": "" + ((parseInt(browserWidth - e.pageX))) + "px"
										})
									} else {
										jQuery(options.tooltipID).css({
											"top": "" + (e.pageY + 15) + "px",
											"left": "" + (parseInt(e.pageX) + 15) + "px"
										})
									}
								});
								jQuery("#tooltip.tooltipUserImageStyle").fadeIn(200)
							} else {
								if (jQuery.inArray("tooltipOptional", array) > -1) {
									var tooltipContent = jQuery(this).attr("rel");
									jQuery("body").append('<div id="tooltip" class="tooltipOptionalStyle">' + tooltipContent + "</div>");
									var offset = jQuery(this).offset();
									var tooltipButtonWidth = jQuery(this).outerWidth();
									var tooltipButtonHeight = jQuery(this).outerHeight();
									var browserWidth = document.documentElement.offsetWidth;
									var tooltipWidth = jQuery(options.tooltipID).innerWidth();
									var tooltipHeight = jQuery(options.tooltipID).innerHeight();
									if (parseInt(offset.left + tooltipWidth + 20) > browserWidth) {
										jQuery(options.tooltipID).css({
											"top": "" + ((offset.top) + tooltipButtonHeight) + "px",
											"right": "" + ((parseInt(browserWidth - offset.left))) + "px"
										})
									} else {
										jQuery(options.tooltipID).css({
											"top": "" + ((offset.top) + tooltipButtonHeight) + "px",
											"left": "" + (parseInt(offset.left) + tooltipButtonWidth) + "px"
										})
									}
								}
							}
						}
					}
				}
			},
			mouseleave: function () {
				jQuery(options.tooltipID).remove()
			}
		})
	})
};

function ClosePageOver() {
	var ie = (document.all) ? 1 : 0;
	if (ie) {
		document.getElementById("PageOver").style.filter = "alpha(opacity=0)";
		document.getElementById("PageOver").style.display = "none"
	} else {
		document.getElementById("PageOver").style.opacity = 0
	}
	document.getElementById("PageOver").style.zIndex = -5
}

function ClosePageOverEffect() {
	var ie = (document.all) ? 1 : 0;
	document.getElementById("PageOver").style.zIndex = 1008;
	var eff = new Effect.Opacity("PageOver", {
		to: 0,
		duration: 0.3,
		transition: Effect.Transitions.linear,
		afterFinish: function () {
			document.getElementById("PageOver").style.zIndex = -5;
			document.getElementById("PageOver").style.visibility = "visible";
			if (ie) {
				document.getElementById("PageOver").style.display = "none"
			}
			document.getElementById("PageOver").style.height = getPageSize()[1] + "px";
			document.getElementById("PageOver").style.width = "100%"
		}
	});
	if (ie) {
		setTimeout("function() { " + 'document.getElementById("PageOver").style.display = "none";' + 'document.getElementById("PageOver").style.zIndex = -5;' + 'document.getElementById("PageOver").style.visibility = "visible";' + "}", 300)
	}
}

function OpenDialog(e) {
	var t = document.all ? 1 : 0;
	document.getElementById("PageOver").style.opacity = 0;
	if (t) {
		document.getElementById("PageOver").style.filter = "alpha(opacity=0)";
		document.getElementById("PageOver").style.display = "block"
	}
	document.getElementById("PageOver").style.visibility = "visible";
	document.getElementById("PageOver").style.height = getPageSize()[1] + "px";
	document.getElementById("PageOver").style.width = "100%";
	document.getElementById("PageOver").style.zIndex = 1008;
	jQuery("#PageOver").attr("onclick", "CloseDialog('" + e + "');");
	var n = new Effect.Opacity("PageOver", {
		to: 0.8,
		duration: 0.3,
		transition: Effect.Transitions.linear,
		afterFinish: function (n) {
			document.getElementById("PageOver").style.zIndex = 1008;
			var r = document.getElementById(e);
			Element.extend(r);
			var i = getWindowHeight();
			var s = getWindowWidth();
			r.style.position = "absolute";
			r.style.zIndex = 1009;
			r.style.display = "block";
			scrpos = getScrollXY();
			r.style.left = String(s / 2 - parseInt(r.getWidth()) / 2 + scrpos[0]) + "px";
			r.style.top = String(i / 2 - parseInt(r.getHeight()) / 2 + scrpos[1]) + "px";
			r.style.visibility = "visible";
			opendropdowns = $(e).getElementsByTagName("select");
			for (var o = 0; o < opendropdowns.length; o++) {
				dropDown = opendropdowns[o]
			}
			if (r.tagName != "table" || !t) {
				jQuery("#" + e).find("#closeButton").remove();
				var u = jQuery("<img id='closeButton' onclick='CloseDialog(\"" + e + "\")' style='display: inline; position: absolute; right: 12px; top: 12px; z-index: 80; cursor: pointer;' src='/images/formdialog/box_header_close.png'/>");
				jQuery("#" + e).append(u)
			}
		}
	});
	jQuery(document).on("keydown", function (t) {
		if (t.which == 27) {
			CloseDialog(e)
		}
	})
}

function CloseDialog(e, isPageOverClick) {
	if (typeof isPageOverClick != "undefined" && isPageOverClick == false) {
		return
	}
	var t = document.getElementById(e);
	t.style.display = "none";
	t.style.visibility = "hidden";
	t.style.zIndex = -2;
	ClosePageOverEffect();
	if (document.body.style.overflow == "hidden") {
		document.body.style.overflow = "scroll"
	}
	jQuery("#PageOver").removeAttr("onclick")
}

function getWindowHeight() {
	var windowHeight = 0;
	if (typeof (window.innerHeight) == "number") {
		windowHeight = window.innerHeight
	} else {
		if (document.documentElement && document.documentElement.clientHeight) {
			windowHeight = document.documentElement.clientHeight
		} else {
			if (document.body && document.body.clientHeight) {
				windowHeight = document.body.clientHeight
			}
		}
	}
	return windowHeight
}

function getWindowWidth() {
	var windowWidth = 0;
	if (typeof (window.innerWidth) == "number") {
		windowWidth = window.innerWidth
	} else {
		if (document.documentElement && document.documentElement.clientWidth) {
			windowWidth = document.documentElement.clientWidth
		} else {
			if (document.body && document.body.clientWidth) {
				windowWidth = document.body.clientWidth
			}
		}
	}
	return windowWidth
}

function getScrollXY() {
	var scrOfX = 0,
		scrOfY = 0;
	if (typeof (window.pageYOffset) == "number") {
		scrOfY = window.pageYOffset;
		scrOfX = window.pageXOffset
	} else {
		if (document.body && (document.body.scrollLeft || document.body.scrollTop)) {
			scrOfY = document.body.scrollTop;
			scrOfX = document.body.scrollLeft
		} else {
			if (document.documentElement && (document.documentElement.scrollLeft || document.documentElement.scrollTop)) {
				scrOfY = document.documentElement.scrollTop;
				scrOfX = document.documentElement.scrollLeft
			}
		}
	}
	return [scrOfX, scrOfY]
}

function ShowMenu(el, target) {
	Element.extend(el);
	if (el.up().style.position != "absolute") {
		pos = Position.cumulativeOffset(el);
		tx = (pos[0] + el.getWidth() - 0) + "px";
		ty = pos[1] + "px"
	} else {
		tx = (parseInt(el.up().style.width) - 2) + "px";
		hh = 0;
		hx = 0;
		while (el.previous(".MenuItem", hx) != undefined) {
			hh += 20;
			hx += 1
		}
		ty = hh + "px"
	}
	$(target).style.left = tx;
	$(target).style.top = ty;
	$(target).show()
}

function ShowDTMenu(target) {
	var myArr = target.split("_");
	re = /\d+/g;
	myArr.each(function (s) {
		if (s.match(re)) {
			no = s.match(re)
		}
	});
	str = "";
	for (var i = 0; i < myArr.length - 1; i++) {
		str = str + myArr[i] + "_"
	}
	img = "img_" + str.substr(0, str.lastIndexOf("_")) + "_" + no;
	if ($(target).visible()) {
		if (src.indexOf("down")) {
			src = src.replace("down", "left")
		}
		$(img).src = src;
		$(target).hide()
	} else {
		if (!$(target).visible()) {
			$(target).show();
			src = $(img).src;
			if (src.indexOf("left")) {
				src = src.replace("left", "down")
			}
			$(img).src = src
		}
	}
}

function ShowMenu2(target) {
	$(target).show()
}

function HideMenu(target) {
	$(target).hide()
}

function ShowTooltip(event, source) {
	ttSource = $(source);
	if ($("IdeaToolTip") != null && $("IdeaToolTip").visible) {
		tt = $("IdeaToolTip");
		css = tt.classNames();
		for (var i = 0; i < css.length; i++) {
			tt.removeClassName(css[i])
		}
	} else {
		tt = document.createElement("div");
		Element.extend(tt);
		tt.id = "IdeaToolTip";
		tt.hide();
		document.body.appendChild(tt);
		Position.absolutize(tt)
	}
	tt.addClassName(ttSource.className);
	tt.update(ttSource.innerHTML);
	tt.setStyle({
		"width": ttSource.style.width,
		"height": ttSource.style.height,
		"display": "block",
		"z-index": 1050
	});
	tt.style.left = (Event.pointerX(event) + 15) + "px";
	tt.style.top = (Event.pointerY(event)) + "px";
	tt.makePositioned();
	tt.show()
}

function ShowTooltipPositioned(a, b, c, d) {
	ttSource = $(b);
	if (ttSource.children[0] && ttSource.children[0].tagName == "IMG") {
		ttSource.children[0].src = ttSource.children[0].getAttribute("realimage")
	}
	if ($("IdeaToolTip") != null && $("IdeaToolTip").visible) {
		tt = $("IdeaToolTip");
		css = tt.classNames();
		for (i = 0; i < css.length; i++) {
			tt.removeClassName(css[i])
		}
	} else {
		tt = document.createElement("div");
		Element.extend(tt);
		tt.id = "IdeaToolTip";
		tt.hide();
		document.body.appendChild(tt);
		Position.absolutize(tt)
	}
	ttSource = $(b);
	tt.addClassName(ttSource.className);
	tt.update(ttSource.innerHTML);
	tt.setStyle({
		width: ttSource.style.width,
		height: ttSource.style.height,
		display: "block",
		"z-index": 1050
	});
	tt.style.left = Event.pointerX(a) + c + "px";
	tt.style.top = Event.pointerY(a) + d + "px";
	tt.makePositioned();
	tt.show()
}

function HideTooltip() {
	$("IdeaToolTip").hide()
}

function getPageSize() {
	var xScroll, yScroll;
	if (window.innerHeight && window.scrollMaxY) {
		xScroll = document.body.scrollWidth;
		yScroll = window.innerHeight + window.scrollMaxY
	} else {
		if (document.body.scrollHeight > document.body.offsetHeight) {
			xScroll = document.body.scrollWidth;
			yScroll = document.body.scrollHeight
		} else {
			xScroll = document.body.offsetWidth;
			yScroll = document.body.offsetHeight
		}
	}
	var windowWidth, windowHeight;
	if (self.innerHeight) {
		windowWidth = self.innerWidth;
		windowHeight = self.innerHeight
	} else {
		if (document.documentElement && document.documentElement.clientHeight) {
			windowWidth = document.documentElement.clientWidth;
			windowHeight = document.documentElement.clientHeight
		} else {
			if (document.body) {
				windowWidth = document.body.clientWidth;
				windowHeight = document.body.clientHeight
			}
		}
	}
	if (yScroll < windowHeight) {
		pageHeight = windowHeight
	} else {
		pageHeight = yScroll
	}
	if (xScroll < windowWidth) {
		pageWidth = windowWidth
	} else {
		pageWidth = xScroll
	}
	arrayPageSize = new Array(pageWidth, pageHeight, windowWidth, windowHeight);
	return arrayPageSize
}

function addSearchLabelToUrl(type) {
	var formId = "";
	var slabel = "";
	if (type == "1") {
		formId = "QuickSearch";
		slabel = document.getElementById("QuickSearchLabel").value
	} else {
		if (type == "2") {
			var slabel = document.getElementById("QuickSearchBlockLabel").value;
			formId = "QuickSearchBlock"
		}
	}
	if (slabel.indexOf("&") == 0) {
		slabel = slabel.substring(1, slabel.length)
	}
	var url = document.getElementById(formId).action;
	url += slabel.replace("+", "%2B");
	window.location = url;
	return false
}
var selectElements = document.getElementsByTagName("select");
jQuery(document).ready(function () {
	var selectId = "";
	for (var i = 0; i < selectElements.length; i++) {
		selectId = selectElements[i].getAttribute("id")
	}
});

function IdeaCurr(defaultCurr) {
	this.Currencies = new Array();
	this.Currencies["YTL"] = 3;
	this.Currencies["TL"] = 2;
	this.DefaultCurr = defaultCurr
}
IdeaCurr.prototype.Load = function (currencies) {
	ideacurr1.Currencies = new Array();
	var currencies = currencies.split("-");
	var currValues = new Array();
	for (var i = 0; i < currencies.length; i++) {
		currValues = currencies[i].split("_");
		ideacurr1.Currencies[currValues[0]] = parseFloat(currValues[1])
	}
};
IdeaCurr.prototype.Convert = function (price, from, to) {
	if (from == "YTL") {
		from = "TL"
	}
	if (to == "YTL") {
		to = "TL"
	}
	var price1 = this.Currencies[from];
	var price2 = this.Currencies[to];
	var ratio = price1 / price2;
	var result = price * ratio;
	return result.toFixed(4)
};

function IdeaCompare(maxCompareCount) {
	this.MAX_COMPARE_PRODUCT_COUNT = maxCompareCount;
	this.products = new Array();
	this.load()
}
IdeaCompare.prototype.addToCompare = function (pid) {
	this.load();
	if (this.products.length > this.MAX_COMPARE_PRODUCT_COUNT) {
		return false
	}
	pid = parseInt(pid);
	if (isNaN(pid) || pid <= 0) {
		return false
	}
	for (var i = 0; i < this.products.length; i++) {
		if (this.products[i] == pid) {
			return false
		}
	}
	this.products[this.products.length] = pid;
	this.updateCookie();
	this.updateComparePanel()
};
IdeaCompare.prototype.hasProduct = function (productId) {
	for (var i = 0; i < this.products.length; i++) {
		if (this.products[i] == productId) {
			return true
		}
	}
	return false
};
IdeaCompare.prototype.updateComparePanel = function () {
	if (this.products.length != 0) {
		var inputs = document.getElementsByTagName("input");
		var elementId = "";
		for (var i = 0; i < inputs.length; i++) {
			pid = parseInt(inputs[i].getAttribute("pid"));
			if (isNaN(pid) || pid <= 0) {
				continue
			}
			elementId = inputs[i].getAttribute("id");
			$(elementId).checked = this.hasProduct(pid)
		}
	} else {
		var inputs = document.getElementsByTagName("input");
		var elementId = "";
		for (var i = 0; i < inputs.length; i++) {
			pid = parseInt(inputs[i].getAttribute("pid"));
			if (isNaN(pid) || pid <= 0) {
				continue
			}
			elementId = inputs[i].getAttribute("id");
			$(elementId).checked = this.hasProduct(pid)
		}
	}
};
IdeaCompare.prototype.nextElementId = function (element) {
	if (document.all) {
		var parent = element.parentNode;
		var children = parent.childNodes;
		for (var i = 0; i < children.length; i++) {
			if (children[i] == element) {
				if (i < children.length - 2) {
					return children[i + 2].getAttribute("id")
				}
				return false
			}
		}
		return false
	} else {
		if (element.nextSibling == null) {
			return false
		}
		return element.nextSibling.nextSibling.getAttribute("id")
	}
};
IdeaCompare.prototype.removeFromCompare = function (pid) {
	this.load();
	pid = parseInt(pid);
	if (isNaN(pid) || pid <= 0) {
		return false
	}
	var index = 0;
	while (index < this.products.length && this.products[index] != pid) {
		index++
	}
	if (index < this.products.length) {
		if (this.products.length > 1) {
			for (var i = index; i < this.products.length - 1; i++) {
				this.products[i] = this.products[i + 1]
			}
			this.products.length = this.products.length - 1
		} else {
			this.products = new Array()
		}
	}
	this.updateCookie();
	if (typeof compareProductList !== "undefined" && jQuery.isFunction(compareProductList.removeCompareProduct)) {
		compareProductList.removeCompareProduct(pid);
		return
	}
	this.updateComparePanel()
};
IdeaCompare.prototype.load = function () {
	this.products = this.getCookie("IdeaCompareProducts").split(",")
};
IdeaCompare.prototype.updateCookie = function () {
	var a = new Array();
	jQuery.each(this.products, function (i, id) {
		if (id != "") {
			a.push(id)
		}
	});
	this.products = a;
	this.setCookie("IdeaCompareProducts", this.products.join(","))
};
IdeaCompare.prototype.getCookie = function (name) {
	if (document.cookie.length > 0) {
		c_start = document.cookie.indexOf(name + "=");
		if (c_start != -1) {
			c_start = c_start + name.length + 1;
			c_end = document.cookie.indexOf(";", c_start);
			if (c_end == -1) {
				c_end = document.cookie.length
			}
			return unescape(document.cookie.substring(c_start, c_end))
		}
	}
	return ""
};
IdeaCompare.prototype.setCookie = function (name, value) {
	var date = new Date();
	date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
	document.cookie = name + "=" + value + "; expires=" + date.toGMTString() + "; path=/"
};

function OpenProduct(id) {
	jQuery("#OpenProduct_Body").load("/product/view-ajax/" + id, function () {
		jQuery('[data-selector="preview-product"] [data-display-status="0"]').css("display", "none");
		jQuery('[data-selector="preview-thumb-image"]').live("click", function () {
			jQuery("#PrimaryImage2").attr("src", jQuery(this).find("img").attr("src"));
			jQuery("#BPrimaryImage2").attr("src", jQuery(this).attr("data-original-url"))
		})
	});
	OpenDialog("OpenProduct")
}

function OpenProductOptions(id) {
	jQuery("#OpenProductOptions_Body").load("/index.php?do=catalog/showOptions.ajax&id=" + id);
	OpenDialog("OpenProductOptions")
}

function showOptions(id) {
	if (jQuery(".optionsProducts_" + id).css("display") == "none") {
		jQuery(".optionsProducts_" + id).css("display", "")
	} else {
		jQuery(".optionsProducts_" + id).css("display", "none")
	}
}

function fblogin() {
	url = document.getElementById("fburl").value;
	window.open(url, "newRegister", "width=600,height=400,top=200,left=200")
}

function googlelogin() {
	url = document.getElementById("googleloginurl").value;
	window.open(url, "newRegister", "width=600,height=400,top=200,left=200")
}

function getCookie(b) {
	var c, a, e, d = document.cookie.split(";");
	for (c = 0; c < d.length; c++) {
		a = d[c].substr(0, d[c].indexOf("="));
		e = d[c].substr(d[c].indexOf("=") + 1);
		a = a.replace(/^\s+|\s+$/g, "");
		if (a == b) {
			return unescape(e)
		}
	}
}

function setCookie(a, d, b) {
	var e = new Date();
	e.setTime(e.getTime() + b * 24 * 60 * 60 * 1000);
	var c = escape(d) + (b == null ? "" : "; expires=" + e.toUTCString());
	document.cookie = a + "=" + c
}

function pageScroolTop() {
	jQuery("html, body").animate({
		scrollTop: 0
	}, 600)
}

function loadShowLabel(labelsVal, reloadPage) {
	var stockOnly = null,
		searchAlpha = null,
		searchPrice = null,
		tp = null;
	var keyValues = window.location.hash.replace("#", "").split("&");
	for (var i = 0; i < keyValues.length; i++) {
		var key = keyValues[i].split("=");
		if (key[0] == "labels" && key[1] != "undefined") {
			labelsVal = key[1]
		} else {
			if (key[0] == "stockOnly" && key[1] != "undefined") {
				stockOnly = key[1]
			} else {
				if (key[0] == "searchalpha" && key[1] != "undefined") {
					searchAlpha = key[1]
				} else {
					if (key[0] == "searchprice" && key[1] != "undefined") {
						searchPrice = key[1]
					} else {
						if (key[0] == "tp" && key[1] != "undefined") {
							tp = key[1]
						}
					}
				}
			}
		}
	}
	showLabelContent(labelsVal, stockOnly, searchAlpha, searchPrice, tp, reloadPage)
}

function getParameterByName(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
	return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "))
}

function showLabelContent(labelsVal, stockOnly, searchAlpha, searchPrice, tp, reloadPage) {
	if (labelsVal == "") {
		window.location = "/";
		return
	}
	var queryString = "";
	var queryStringTp = "";
	var url = "labels=" + labelsVal;
	if (stockOnly != null || searchAlpha != null || searchPrice != null) {
		queryString = "&stockOnly=" + stockOnly + "&searchalpha=" + searchAlpha + "&searchprice=" + searchPrice;
		url += queryString
	}
	if (tp != null) {
		queryStringTp = "&tp=" + tp;
		url += queryStringTp
	}
	if (typeof reloadPage == "undefined") {
		reloadPage = false
	}
	window.location.hash = url;
	if (!reloadPage && !ie7) {
		return
	}
	jQuery("#showLabelContentWrapper").html("<div id='showLabelContentLoading'></div>");
	if (jQuery("#labelFilterMenu").attr("id") != undefined) {
		jQuery.ajax({
			type: "GET",
			url: "/index.php?do=catalog/labelFilterBlock.ajax",
			data: "labels=" + labelsVal + queryString + queryStringTp,
			dataType: "json",
			async: true,
			success: function (json) {
				if (json.redirectUrl != undefined && json.redirectUrl != "") {
					window.location = json.redirectUrl;
					return
				}
				jQuery("#labelFilterMenu").html(json.results);
				ChangeCheckBoxStyle();
				ChangeRadioBoxStyle();
				jQuery(".tooltipUserImage").tooltip();
				jQuery.ajax({
					type: "GET",
					url: "/index.php?do=catalog/showLabel.ajax",
					data: "labels=" + labelsVal + queryString + queryStringTp,
					dataType: "json",
					async: true,
					success: function (json) {
						if (json.redirectUrl != undefined && json.redirectUrl != "") {
							window.location = json.redirectUrl
						}
						var template = json.template;
						jQuery("#showLabelContentWrapper").html(template);
						if (jQuery(".lazy").attr("id") != undefined) {
							jQuery("img.lazy").lazyload({
								effect: "fadeIn",
								effectspeed: 500,
								skip_invisible: false
							})
						}
						ChangeCheckBoxStyle();
						ChangeRadioBoxStyle();
						jQuery(".tooltipUserImage").tooltip();
						if (typeof ajaxCategoryScriptFunc != "undefined") {
							ajaxCategoryScriptFunc()
						}
					}
				})
			}
		})
	} else {
		jQuery.ajax({
			type: "GET",
			url: "/index.php?do=catalog/showLabel.ajax",
			data: "labels=" + labelsVal + queryString + queryStringTp,
			dataType: "json",
			async: true,
			success: function (json) {
				if (json.redirectUrl != undefined && json.redirectUrl != "") {
					window.location = json.redirectUrl
				}
				var template = json.template;
				jQuery("#showLabelContentWrapper").html(template);
				if (jQuery(".lazy").attr("id") != undefined) {
					jQuery("img.lazy").lazyload({
						effect: "fadeIn",
						effectspeed: 500,
						skip_invisible: false
					})
				}
				ChangeCheckBoxStyle();
				ChangeRadioBoxStyle();
				jQuery(".tooltipUserImage").tooltip();
				if (typeof ajaxCategoryScriptFunc != "undefined") {
					ajaxCategoryScriptFunc()
				}
			}
		})
	}
}
jQuery(document).ready(function () {
	jQuery(".tooltipForm").tooltip();
	jQuery(".tooltipGeneral").tooltip();
	jQuery(".tooltipOptional").tooltip();
	jQuery(".tooltipImage").tooltip();
	jQuery(".tooltipUserImage").tooltip();
	jQuery(".notification").each(function () {
		jQuery(this).find(".notificationClosed").click(function () {
			jQuery(this).parents(".notification").fadeOut(500)
		})
	})
});

function controlDecimalOnly(e) {
	var keynum;
	var keychar;
	var numcheck;
	if (window.event) {
		keynum = e.keyCode
	} else {
		if (e.which) {
			keynum = e.which
		}
	}
	if ((Number(keynum) <= 123 && Number(keynum) >= 112) || Number(keynum) == 13 || Number(keynum) == 9 || Number(keynum) == 8) {
		return true
	}
	if ((Number(keynum) >= 48 && Number(keynum) <= 57) || Number(keynum) == 190 || (Number(keynum) >= 96 && Number(keynum) <= 105)) {
		return true
	}
	return false
}

function controlFloatOnly(e) {
	if (controlDecimalOnly(e)) {
		return true
	}
	var keynum;
	if (window.event) {
		keynum = e.keyCode
	} else {
		if (e.which) {
			keynum = e.which
		}
	}
	if (Number(keynum) == 191) {
		return true
	}
	return false
}
var IdeaDelay = (function () {
	var timer = 0;
	return function (callback, ms) {
		clearTimeout(timer);
		timer = setTimeout(callback, ms)
	}
})();

function onDocumentLoad(callback) {
	var DocumentLoadTimer = setInterval(function () {
		if (document.readyState == "complete") {
			clearInterval(DocumentLoadTimer);
			if (callback && typeof callback == "function") {
				callback()
			}
		}
	}, 10)
}(function (window) {
	window.ITracking = {
		addScript: function (id, url, callback) {
			if (document.querySelectorAll('script[id="' + id + '"]').length != 0) {
				if (callback && typeof callback === "function") {
					callback()
				}
				return
			}
			var script = document.createElement("script");
			script.type = "text/javascript";
			script.async = true;
			script.src = url;
			script.setAttribute("id", id);
			script.onload = script.onreadystatechange = function () {
				if ((!this.readyState || this.readyState == "complete")) {
					if (callback && typeof callback === "function") {
						callback()
					}
				}
			};
			var getFirstScriptTag = document.getElementsByTagName("script")[0];
			getFirstScriptTag.parentNode.insertBefore(script, getFirstScriptTag)
		},
		google: {
			conversion: function (params) {
				if (ITracking.utils.isUndefined(params)) {
					console.error('"Google Conversion Params" is undefined');
					return
				}
				if (!ITracking.utils.isObject(params)) {
					console.error('"Google Conversion Params" is not object')
				}
				if (ITracking.utils.isUndefined(window.google_trackConversion)) {
					console.error('"google_trackConversion" is undefined');
					return
				}
				window.google_trackConversion(params)
			}
		},
		utils: {
			isMobile: function () {
				return (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/iPhone|iPad|iPod/i) || navigator.userAgent.match(/Opera Mini/i) || navigator.userAgent.match(/IEMobile/i))
			},
			isObject: function (value) {
				return value !== null && typeof value === "object"
			},
			isUndefined: function (value) {
				return typeof value === "undefined"
			},
			isDefined: function (value) {
				return typeof value !== "undefined"
			}
		}
	}
})(window);

function IdeaCart() {
	this.productCount = 0;
	this.products = new Hash;
	if (jQuery(".hiddenCart").length > 0) {
		this.cartTemplate = new Template("")
	} else {
		this.cartTemplate = new Template('<table class="blockShoppingCartItemContainer" cellspacing="0" cellpadding="0" width="100%"><tr><td height="h15"><img src="/images/icons/arrowblack.gif" class="mR5 w8 h8" alt="" />#{product}</td><td align="right" valign="top"><a href="JavaScript:ideacart1.RemoveFromCart(\'#{pid}\')"><img src="/images/icons/xx.gif" alt="" /></a></td></tr><tr><td class="h15">#{amount} <span class="_fontWeightNormal">#{stockTypeLabel}</span> <span class="_colorRed">#{price} #{curr}</span></td></tr></table>')
	}
	this.lastUpdate = "";
	this.lastId = new Hash;
	this.customizationConstraints = [];
	this.lastProductId = null;
	this.lastProductQuantity = null;
	this.lastAdditionalCartUpdateDisableState = null;
	this.lastExtraButtonType = null
}
var pdrags = new Hash;
var DDS = new Array;
var totalAmount = 0;
var isCartReadingAnyFile = false;
IdeaCart.prototype.AddToCartBasic = function (productId, htmlElement, priceWithoutTax, currency, tax, rebate, rebateType, moneyOrderAmount, stockTypeLabel, isAdditionalCartUpdateDisable, rootProduct, categoryId, brandId, extraButtonType, isLightBoxDisable) {
	if (parseFloat(priceWithoutTax) < 0.01) {
		alert("ÃœrÃ¼n fiyatÄ± hatalÄ± olduÄŸu iÃ§in sepete atÄ±lamaz. LÃ¼tfen sistem yÃ¶neticisiyle irtibata geÃ§iniz");
		return false
	}
	if (parseFloat(extraButtonType) < 0.01 && parseFloat(rebateType) < 0.01) {
		alert("ÃœrÃ¼n fiyatÄ± hatalÄ± olduÄŸu iÃ§in sepete atÄ±lamaz. LÃ¼tfen sistem yÃ¶neticisiyle irtibata geÃ§iniz");
		return false
	}
	if (false === this.CheckCustomizationFieldsOfCart()) {
		return false
	}
	try {
		if (priceIndex > 1) {
			rebate = 0;
			rebateType = 1
		}
	} catch (err) {}
	if (extraButtonType == null) {
		extraButtonType = ""
	}
	stockTypeLabel = unescape(stockTypeLabel);
	if (DDS.length > 0 && this.lastId.toArray().length == 0 && this.productCount > 0) {
		this.products.each(function (productId) {
			if (ideacart1.lastId[productId.value.pid] == undefined) {
				ideacart1.lastId[productId.value.pid] = 0
			}
			if (productId.value.ext > parseInt(ideacart1.lastId[productId.value.pid])) {
				ideacart1.lastId[productId.value.pid] = productId.value.ext
			}
		})
	}
	temp2 = "";
	if (DDS.length > 0) {
		var v = new Array;
		for (var m = 0; m < DDS.length; m++) {
			var g = DDS[m].id;
			optionLabel = $(g).value;
			if (optionLabel != "") {
				v.push(optionLabel)
			}
		}
		temp2 = v.join("/")
	}
	if (temp2 != "") {
		htmlElement = htmlElement + " " + temp2
	}
	htmlElement = unescape(htmlElement);
	htmlElement = unescape(escape(htmlElement).replace(/%C2%A0/g, "%20"));
	htmlElement = unescape(escape(htmlElement).replace(/%A0/g, "%20"));
	htmlElement = htmlElement.replace(/[^0-9a-zA-ZÄŸÃ¼ÅŸÄ±iÃ¶Ã§ÄžÃœÅžIÄ°Ã–Ã‡Ã¢\rebate\.\*\+&;#,=\[\]{}\(\)\/\\%\$\^\?@:<>\-_!â‚¬~ ]/gi, "");
	if (htmlElement.indexOf("}") > 0) {
		htmlElement = htmlElement.replace(/}/gi, "}")
	}
	if (htmlElement.indexOf("{") > 0) {
		htmlElement = htmlElement.replace(/{/gi, "{")
	}
	pid2 = productId;
	if (this.lastId[productId] && this.products["pr_" + productId + "_" + this.lastId[productId]]) {
		exist = false;
		index = 0;
		for (var m = 1; m <= this.lastId[productId]; m++) {
			if (!this.products["pr_" + productId + "_" + m]) {
				continue
			}
			currentel = this.products["pr_" + productId + "_" + m]["product"].toString();
			currentel = unescape(currentel);
			currentel = unescape(escape(currentel).replace(/%C2%A0/g, "%20"));
			currentel = unescape(escape(currentel).replace(/%A0/g, "%20"));
			currentel = currentel.replace(/[^0-9a-zA-ZÄŸÃ¼ÅŸÄ±iÃ¶Ã§ÄžÃœÅžIÄ°Ã–Ã‡Ã¢\s\rebate\.\*\+&;#,=\[\]{}\(\)\/\\%\$\^\?@:<>\-_!â‚¬~]/gi, "");
			if (htmlElement.toLowerCase() == currentel.toLowerCase()) {
				exist = true;
				index = m
			}
		}
		if (exist) {
			ext = index
		} else {
			this.lastId[productId]++;
			ext = this.lastId[productId]
		}
	} else {
		ext = 1;
		this.lastId[productId] = 1
	}
	productId = productId + "_" + ext;
	var cartItemAmount = parseFloat(IdeaCart.prototype.GetCartAmount(pid2, ext, stockTypeLabel));
	if (cartItemAmount == 0) {
		return false
	}
	if ($("cartItem_" + productId) != null) {
		var b = parseFloat(cartItemAmount) - parseFloat(this.products["pr_" + productId]["amount"]);
		this.products["pr_" + productId]["amount"] = cartItemAmount;
		pr = parseFloat(this.products["pr_" + productId]["price"]);
		if (rebate != 0 && rebateType == 1 || rebateType == 0) {
			if (rebateType == 0) {
				pr = rebate
			} else {
				pr = pr * (100 - rebate) / 100
			}
		}
		pr = pr * (100 + tax) / 100;
		pr = pr.toFixed(2);
		total = parseFloat(pr) * parseFloat(this.products["pr_" + productId]["amount"]);
		total = total.toFixed(2);
		totalAmount += parseFloat(ideacurr1.Convert(pr, this.products["pr_" + productId]["curr"], ideacurr1.DefaultCurr)) * b;
		totalAmount = parseFloat(totalAmount.toFixed(2));
		$("cartItem_inner_" + productId).innerHTML = this.cartTemplate.evaluate({
			product: this.products["pr_" + productId]["product"].truncate(22, "..."),
			amount: this.products["pr_" + productId]["amount"],
			pid: productId,
			price: total,
			curr: currency,
			stockTypeLabel: stockTypeLabel
		})
	} else {
		this.productCount++;
		this.products["pr_" + productId] = new Hash;
		this.products["pr_" + productId]["amount"] = cartItemAmount;
		this.products["pr_" + productId]["price"] = priceWithoutTax;
		this.products["pr_" + productId]["product"] = htmlElement;
		this.products["pr_" + productId]["pid"] = pid2;
		this.products["pr_" + productId]["curr"] = currency;
		this.products["pr_" + productId]["tax"] = tax;
		this.products["pr_" + productId]["rebate"] = rebate;
		this.products["pr_" + productId]["rebateType"] = rebateType;
		this.products["pr_" + productId]["bt"] = moneyOrderAmount;
		this.products["pr_" + productId]["ext"] = ext;
		this.products["pr_" + productId]["stockTypeLabel"] = stockTypeLabel;
		this.products["pr_" + productId]["rootProduct"] = rootProduct;
		this.products["pr_" + productId]["categoryId"] = categoryId;
		this.products["pr_" + productId]["brandId"] = brandId;
		pr = priceWithoutTax;
		if (rebate != 0 && rebateType == 1 || rebateType == 0) {
			if (rebateType == 0) {
				pr = rebate
			} else {
				pr = pr * (100 - rebate) / 100
			}
		}
		pr = pr * (100 + tax) / 100;
		pr = pr.toFixed(2);
		total = parseFloat(pr) * parseFloat(this.products["pr_" + productId]["amount"]);
		total = total.toFixed(2);
		totalAmount += parseFloat(ideacurr1.Convert(pr, this.products["pr_" + productId]["curr"], ideacurr1.DefaultCurr)) * parseFloat(this.products["pr_" + productId]["amount"]);
		totalAmount = parseFloat(totalAmount.toFixed(2));
		var S = document.createElement("div");
		Element.extend(S);
		S.addClassName("productOnCart");
		S.innerHTML = this.cartTemplate.evaluate({
			product: this.products["pr_" + productId]["product"].truncate(22, "..."),
			amount: this.products["pr_" + productId]["amount"],
			pid: productId,
			price: total,
			curr: currency,
			stockTypeLabel: stockTypeLabel
		});
		S.id = "cartItem_inner_" + productId;
		var E = document.createElement("div");
		Element.extend(E);
		E.id = "cartItem_" + productId;
		E.appendChild(S);
		if (this.productCount == 1) {
			jQuery(".cartContainer").html("")
		}
		jQuery(".cartContainer").append(E)
	}
	if ($("totalCartAmount")) {
		$("totalCartAmount").innerHTML = "<b>Toplam :</b> <span class='_colorRed _fontWeightBold'>" + totalAmount.toFixed(2) + " " + ideacurr1.DefaultCurr + "</span>"
	}
	IdeaCart.prototype.ChangeAddToCartButton(pid2, "nostock");
	if (pdrags[pid2]) {
		pdrags[pid2].destroy()
	}
	var itemAmount = null;
	if (b) {
		itemAmount = b
	} else {
		itemAmount = parseFloat(this.products["pr_" + productId]["amount"])
	}
	if (!this.CheckRecaptcha(pid2, itemAmount, isAdditionalCartUpdateDisable, extraButtonType)) {
		return false
	}
	if (parseInt(isAdditionalCartUpdateDisable)) {
		try {
			var addToCartResult = AddToCart(pid2, itemAmount);
			window.location = "/index.php?do=catalog/order"
		} catch (error) {
			alert(error);
			return false
		}
	} else {
		try {
			var addToCartResult = AddToCart(pid2, itemAmount)
		} catch (error) {
			alert(error);
			return false
		}
		if (typeof additionalCartUpdate != "undefined") {
			additionalCartUpdate()
		}
	}
	if (addToCartResult && useOrderLightBox == "1" && isLightBoxDisable == null) {
		jQuery("#OrderLightBox_Body").load("/index.php?do=catalog/orderLightBox");
		OpenDialog("OrderLightBox")
	} else {
		shoppingCartInformationBox(extraButtonType)
	}
};
IdeaCart.prototype.GetCartAmount = function (pid, ext, stockTypeLabel) {
	var productRealAmount = parseFloat(jQuery('[data-selector="product-real-amount-' + pid + '"]').val());
	var e = pid + "_" + ext;
	if (productRealAmount == 0) {
		return 0
	}
	var hiddenCart = 0;
	if (stockTypeLabel != undefined && !IdeaCart.prototype.IsStockTypeDecimal(stockTypeLabel) && jQuery("#quantity_" + pid).val() !== undefined && $("quantity_" + pid).value != parseInt($("quantity_" + pid).value)) {
		alert("LÃ¼tfen Stok Adedini tamsayÄ± olarak giriniz");
		return 0
	}
	if ($("quantity_" + pid) != null) {
		if (isNaN(parseFloat($("quantity_" + pid).value))) {
			alert("LÃ¼tfen Stok Adedini DoÄŸru Giriniz.");
			$("quantity_" + pid).value = 1;
			return 0
		}
		var itemAmount = 0;
		ideacart1.products.each(function (item) {
			if (item.value.pid == pid && item.value.ext == ext) {
				itemAmount = parseFloat(itemAmount + item.value.amount)
			}
		});
		if (itemAmount >= productRealAmount) {
			ideacart1.quantityWarn(pid);
			return 0
		}
		if ($("cartItem_" + e) != null) {
			var itemTotalAmount = parseFloat(ideacart1.products["pr_" + e]["amount"]) + parseFloat($("quantity_" + pid).value)
		} else {
			var itemTotalAmount = parseFloat($("quantity_" + pid).value);
			if (itemAmount > 0) {
				itemTotalAmount += itemAmount
			}
		}
		if (itemTotalAmount > productRealAmount) {
			cartItemAmount = productRealAmount;
			ideacart1.quantityWarn(pid);
			if ($("cartItem_" + e) != null) {
				hiddenCart = productRealAmount - parseFloat(ideacart1.products["pr_" + e]["amount"])
			} else {
				hiddenCart = productRealAmount;
				if (itemAmount > 0) {
					cartItemAmount = cartItemAmount - itemAmount;
					hiddenCart = hiddenCart - itemAmount
				}
			}
		} else {
			cartItemAmount = itemTotalAmount;
			hiddenCart = parseFloat($("quantity_" + pid).value)
		}
		if (hiddenCart < 0) {
			hiddenCart = 0
		}
	} else {
		var amountToIncrease = 1;
		if (stockTypeLabel != undefined && IdeaCart.prototype.IsStockTypeDecimal(stockTypeLabel)) {
			amountToIncrease = 0.5
		}
		if (ideacart1.products["pr_" + e] === undefined || ideacart1.products["pr_" + e] === null) {
			cartItemAmount = amountToIncrease
		} else {
			var itemTotalAmount = parseFloat(ideacart1.products["pr_" + e]["amount"]) + amountToIncrease;
			if (itemTotalAmount >= productRealAmount) {
				cartItemAmount = productRealAmount;
				ideacart1.quantityWarn(pid)
			} else {
				cartItemAmount = itemTotalAmount
			}
		}
		hiddenCart = amountToIncrease
	}
	if (jQuery(".hiddenCart").length > 0) {
		var w = parseFloat(jQuery(".hiddenCart").val());
		w = w + hiddenCart;
		jQuery(".hiddenCart").val(w);
		jQuery(".hiddenCartContainer").html(w)
	}
	return cartItemAmount
};
IdeaCart.prototype.AddToCart = function (e, t, n, r, i, s, o, u, a, f, l, c, h, p, d, v) {
	var selectedSelectionExists = true;
	jQuery('[data-selector="selection-group"]').each(function () {
		if (jQuery(this).find("> option:selected").val() == 0) {
			alert("LÃ¼tfen " + jQuery(this).data()["label"] + " Ã¶zelliÄŸini seÃ§iniz.");
			selectedSelectionExists = false;
			return false
		}
		var selectionGroupId = parseInt(jQuery(this).attr("data-selection-group-id"));
		DDS.push(document.getElementById("l_o2c_" + selectionGroupId))
	});
	if (!selectedSelectionExists) {
		return
	}
	ideacart1.AddToCartBasic(e, t, n, r, i, s, o, u, a, f, c, h, p, d, v)
};
IdeaCart.prototype.RemoveFromPage = function (e) {
	if (e == null) {
		return
	}
	Element.extend(e);
	e.remove()
};
IdeaCart.prototype.TruncateCart = function (e) {
	this.productCount = 0;
	if ($("totalCartAmount")) {
		$("totalCartAmount").innerHTML = ""
	}
	this.products = new Hash;
	this.FreeCart();
	SaveCart(escape(this.products.inspect()), "type=e,method=post")
};
IdeaCart.prototype.FreeCart = function (e) {
	try {
		FlushCart()
	} catch (error) {
		alert(error);
		return
	}
	if (jQuery(".hiddenCart").length > 0) {
		jQuery(".cartContainer").html("")
	} else {
		jQuery(".cartContainer").html("<center><br/>AlÄ±ÅŸveriÅŸ sepetinizde <br/> Ã¼rÃ¼n bulunmamaktadÄ±r.<br/><br/></center>")
	}
};
IdeaCart.prototype.RemoveFromCart = function (e) {
	if (this.products["pr_" + e] == undefined) {
		return
	}
	pid2 = this.products["pr_" + e]["pid"];
	if (this.products["pr_" + e]) {
		if (this.products["pr_" + e]["amount"] > 1) {
			this.products["pr_" + e]["amount"] = this.products["pr_" + e]["amount"] - 1;
			rebate = ideacart1.products["pr_" + e]["rebate"];
			rebateType = ideacart1.products["pr_" + e]["rebateType"];
			tax = ideacart1.products["pr_" + e]["tax"];
			pr = parseFloat(this.products["pr_" + e]["price"]);
			if (rebate != 0 && rebateType == 1 || rebateType == 0) {
				if (rebateType == 0) {
					pr = rebate
				} else {
					pr = pr * (100 - rebate) / 100
				}
			}
			pr = pr * (100 + tax) / 100;
			pr = pr.toFixed(2);
			total = parseFloat(pr) * parseFloat(this.products["pr_" + e]["amount"]);
			total = total.toFixed(2);
			totalAmount -= parseFloat(ideacurr1.Convert(pr, ideacart1.products["pr_" + e]["curr"], ideacurr1.DefaultCurr));
			totalAmount = parseFloat(totalAmount.toFixed(2));
			curr = this.products["pr_" + e]["curr"];
			$("cartItem_inner_" + e).innerHTML = this.cartTemplate.evaluate({
				product: this.products["pr_" + e]["product"].truncate(22, "..."),
				amount: this.products["pr_" + e]["amount"],
				pid: e,
				price: total,
				curr: this.products["pr_" + e]["curr"],
				stockTypeLabel: this.products["pr_" + e]["stockTypeLabel"]
			});
			try {
				DeleteCartItemFromCart(e)
			} catch (error) {
				alert(error)
			}
		} else {
			curr = this.products["pr_" + e]["curr"];
			rebate = ideacart1.products["pr_" + e]["rebate"];
			rebateType = ideacart1.products["pr_" + e]["rebateType"];
			tax = ideacart1.products["pr_" + e]["tax"];
			pr = parseFloat(this.products["pr_" + e]["price"]);
			if (rebate != 0 && rebateType == 1 || rebateType == 0) {
				if (rebateType == 0) {
					pr = rebate
				} else {
					pr = pr * (100 - rebate) / 100
				}
			}
			pr = pr * (100 + tax) / 100;
			total = parseFloat(pr) * parseFloat(this.products["pr_" + e]["amount"]);
			total = total.toFixed(2);
			totalAmount -= parseFloat(ideacurr1.Convert(pr, this.products["pr_" + e]["curr"], ideacurr1.DefaultCurr));
			totalAmount = parseFloat(totalAmount.toFixed(2));
			this.products.remove("pr_" + e);
			this.productCount--;
			try {
				DeleteCartItemFromCart(e)
			} catch (error) {
				alert(error)
			}
			new Effect.Fade("cartItem_" + e, {
				duration: 1,
				afterFinish: function (e) {
					ideacart1.RemoveFromPage(e.element);
					if (ideacart1.productCount < 1) {
						ideacart1.productCount = 0;
						ideacart1.FreeCart()
					}
				}
			})
		}
		IdeaCart.prototype.ChangeAddToCartButton(pid2, "addtocart");
		if (this.productCount < 1) {
			totalAmount = 0
		}
		if ($("totalCartAmount")) {
			$("totalCartAmount").innerHTML = totalAmount > 0 ? "<b>Toplam :</b> <span class='_colorRed _fontWeightBold'>" + totalAmount.toFixed(2) + " " + ideacurr1.DefaultCurr + "</span>" : "";
			SaveCart(escape(this.products.inspect()), "type=r,method=post")
		}
	}
};
IdeaCart.prototype.CompleteRemoveFromCart = function (e) {
	try {
		DeleteCartItemFromCart(e, true)
	} catch (error) {
		alert(error);
		return
	}
	this.products.remove("pr_" + e);
	this.productCount--;
	ideacart1.RemoveFromPage($("cartItem_" + e));
	ideacart1.lastId = new Hash;
	this.products.each(function (e) {
		ideacart1.lastId[e.value.pid] = e.value.ext
	});
	if (ideacart1.productCount < 1) {
		ideacart1.productCount = 0;
		ideacart1.FreeCart()
	}
};
IdeaCart.prototype.ReloadCart = function () {
	this.productCount = 0;
	jQuery(".cartContainer").html("");
	var e = 0;
	var t = "";
	totalAmount = 0;
	this.products.each(function (n) {
		pid = n.key.substring(3);
		var r = document.createElement("div");
		Element.extend(r);
		r.id = "cartItem_" + pid;
		var i = document.createElement("div");
		Element.extend(i);
		i.addClassName("productOnCart");
		pr = parseFloat(ideacart1.products["pr_" + pid]["price"]);
		rebate = ideacart1.products["pr_" + pid]["rebate"];
		rebateType = ideacart1.products["pr_" + pid]["rebateType"];
		tax = ideacart1.products["pr_" + pid]["tax"];
		if (rebate != 0) {
			if (rebateType == 0) {
				pr = rebate
			} else {
				pr = pr * (100 - rebate) / 100
			}
		}
		pr = pr * (100 + tax) / 100;
		total = parseFloat(pr) * parseFloat(ideacart1.products["pr_" + pid]["amount"]);
		if (jQuery(".hiddenCart").length > 0) {
			e = e + parseFloat(ideacart1.products["pr_" + pid]["amount"]);
			jQuery(".hiddenCart").val(e);
			jQuery(".hiddenCartContainer").html(e)
		}
		total = total.toFixed(2);
		t = ideacart1.products["pr_" + pid]["curr"];
		totalAmount += parseFloat(ideacurr1.Convert(total, t, ideacurr1.DefaultCurr));
		i.innerHTML = ideacart1.cartTemplate.evaluate({
			product: ideacart1.products["pr_" + pid]["product"].truncate(22, "..."),
			amount: ideacart1.products["pr_" + pid]["amount"],
			pid: pid,
			price: total,
			curr: ideacart1.products["pr_" + pid]["curr"],
			stockTypeLabel: ideacart1.products["pr_" + pid]["stockTypeLabel"]
		});
		i.id = "cartItem_inner_" + pid;
		r.appendChild(i);
		ideacart1.productCount++;
		jQuery(".cartContainer").append(r)
	});
	totalAmount = parseFloat(totalAmount.toFixed(2));
	if (ideacart1.productCount == 0) {
		if (jQuery(".hiddenCart").length > 0) {
			jQuery(".cartContainer").html("");
			jQuery(".hiddenCart").val(0);
			jQuery(".hiddenCartContainer").html(0);
			totalAmount = 0
		} else {
			jQuery(".cartContainer").html("<center><br>AlÄ±ÅŸveriÅŸ sepetinizde <br> Ã¼rÃ¼n bulunmamaktadÄ±r.<br><br></center>");
			if ($("totalCartAmount")) {
				$("totalCartAmount").update = ""
			}
			totalAmount = 0
		}
	} else {
		if ($("totalCartAmount")) {
			$("totalCartAmount").innerHTML = "<b>Toplam :</b> <span class='_colorRed _fontWeightBold'>" + totalAmount.toFixed(2) + " " + ideacurr1.DefaultCurr + "</span>"
		}
	}
};
IdeaCart.prototype.quantityWarn = function (pid) {
	quantityWarning = quantityWarning.replace("(arg0)", parseFloat(jQuery('[data-selector="product-real-amount-' + pid + '"]').val()));
	alert(quantityWarning)
};
IdeaCart.prototype.ChangeAddToCartButton = function (productId, buttonType) {
	if (jQuery("#cartPic_" + productId) == undefined) {
		return
	}
	var totalAmount = 0;
	ideacart1.products.each(function (item) {
		if (productId == item.value.pid) {
			totalAmount = parseFloat(totalAmount + parseFloat(item.value.amount))
		}
	});
	if (buttonType == "addtocart" || totalAmount >= parseFloat(jQuery('[data-selector="product-real-amount-' + productId + '"]').val())) {
		jQuery("img[rel=cartPic_" + productId + "]").each(function () {
			var buttonSrc = jQuery(this).attr("src").replace(/addtocart/g, "nostock");
			jQuery(this).attr("src", buttonSrc).parent("a").attr("href", "javascript:void(0);");
			jQuery(this).addClass("globalNoStockButton").removeClass("globalAddtoCartButton")
		})
	}
};
IdeaCart.prototype.IsStockTypeDecimal = function (stockTypeLabel) {
	stockTypeLabel = stockTypeLabel.toLowerCase();
	return ["m2", "gram", "kg", "metre"].indexOf(stockTypeLabel) > -1
};
IdeaCart.prototype.CheckRecaptcha = function (productId, quantity, isAdditionalCartUpdateDisable, extraButtonType) {
	if (jQuery('[name^="customizationFields"][type=file][value!=""]').length > 0) {
		this.lastProductId = productId;
		this.lastProductQuantity = quantity;
		this.lastAdditionalCartUpdateDisableState = isAdditionalCartUpdateDisable;
		this.lastExtraButtonType = extraButtonType;
		grecaptcha.execute();
		return false
	}
	return true
};
IdeaCart.prototype.CheckCustomizationFieldsOfCart = function () {
	var result = true;
	jQuery('[name^="customizationFields"]').each(function (index, element) {
		if (false === ideacart1.CheckRequirementsOfCustomizationField(element)) {
			var fieldName = jQuery(element).attr("data-customization-field-name");
			alert("ÃœrÃ¼nÃ¼ sepete ekleyebilmeniz iÃ§in " + fieldName + " alanÄ±na bilgi girmeniz gerekmektedir.");
			result = false;
			return false
		}
	});
	return result
};
IdeaCart.prototype.CheckRequirementsOfCustomizationField = function (fieldElement) {
	fieldElement = jQuery(fieldElement);
	var isRequired = fieldElement.attr("data-customization-field-required") == "required";
	if (!isRequired) {
		return true
	}
	var typeOfField = fieldElement.attr("data-customization-field-type");
	switch (typeOfField) {
		case "textbox":
		case "textarea":
		case "file":
		case "dropdown":
			if ("" == fieldElement.val()) {
				return false
			}
			break;
		case "radio":
			return jQuery('[name="customizationFields[' + fieldElement.attr("data-customization-field-id") + ']"]').is(":checked");
			break;
		case "checkbox":
			return jQuery('[name="customizationFields[' + fieldElement.attr("data-customization-field-id") + '][]"]').is(":checked");
			break
	}
	return true
};
IdeaCart.prototype.LoadCustomizationConstraints = function () {
	if (this.customizationConstraints.length == 0) {
		var response = SendRequest("/cart/view_customization_constraints");
		if (!response.success) {
			throw response.errorMessage
		}
		this.customizationConstraints = response.data.constraints
	}
	return this.customizationConstraints
};
IdeaCart.prototype.CheckCustomizationFileSize = function (file) {
	if (file.size > this.LoadCustomizationConstraints().size) {
		throw "Sepete eklemek istediÄŸiniz Ã¼rÃ¼nler iÃ§in gÃ¶nderebileceÄŸiniz dosyalarÄ±n boyutu en fazla " + ideacart1.customizationConstraints.readable_size + " olabilir."
	}
};
IdeaCart.prototype.CheckCustomizationFileExtension = function (file) {
	var splittedFileNameData = file.name.split(".");
	var fileExtension = splittedFileNameData[splittedFileNameData.length - 1].toLowerCase();
	if (this.LoadCustomizationConstraints().extensions.indexOf(fileExtension) < 0) {
		throw "Sepete eklemek istediÄŸiniz Ã¼rÃ¼n iÃ§in gÃ¶ndermiÅŸ olduÄŸunuz " + file.name + " adlÄ± dosyanÄ±n uzantÄ±sÄ± geÃ§ersizdir. LÃ¼tfen geÃ§erli uzantÄ±lÄ± bir dosya gÃ¶ndermeyi deneyiniz."
	}
};
IdeaCart.prototype.CheckCustomizationFileMimeType = function (file) {
	if (this.LoadCustomizationConstraints().mime_types.indexOf(file.type) < 0) {
		throw "Sepete eklemek istediÄŸiniz Ã¼rÃ¼n iÃ§in gÃ¶ndermiÅŸ olduÄŸunuz " + file.name + " adlÄ± dosyanÄ±n tipi geÃ§ersizdir. LÃ¼tfen geÃ§erli tipte bir dosya gÃ¶ndermeyi deneyiniz."
	}
};

function AddToCartViaRecaptcha(token) {
	try {
		AddToCart(ideacart1.lastProductId, ideacart1.lastProductQuantity, ideacart1.lastAdditionalCartUpdateDisableState, this.lastExtraButtonType, token)
	} catch (error) {
		alert(error)
	}
}

function AddToCart(productId, quantity, additionalCartUpdateDisable, lastExtraButtonType, recaptchaToken) {
	var attributes = {};
	jQuery("._additoanalFeatures").each(function (item, element) {
		var label = jQuery(element).data("label");
		var value = jQuery(element).attr("value");
		attributes[label] = value
	});
	var postParams = {};
	postParams.productId = productId;
	postParams.quantity = quantity;
	postParams.attributes = attributes;
	if (jQuery('[name="useSubscription"]').attr("checked") == "checked") {
		postParams.subscriptionId = jQuery('[name="useSubscription"]').attr("data-subscription-id");
		postParams.subscriptionPeriod = jQuery('[name="subscriptionPeriod"] option:selected').val();
		if (postParams.subscriptionPeriod <= 0) {
			throw "ÃœrÃ¼nÃ¼ sepete atabilmek iÃ§in Ã§ekim periyodu belirtilmelidir."
		}
		postParams.subscriptionDispatchCount = jQuery('[name="subscriptionDispatchCount"] option:selected').val();
		if (postParams.subscriptionDispatchCount <= 0) {
			throw "ÃœrÃ¼nÃ¼ sepete atabilmek iÃ§in Ã§ekim sÃ¼resi belirtilmelidir."
		}
		jQuery('[name="useSubscription"]').removeAttr("checked")
	}
	if (recaptchaToken) {
		postParams.recaptchaToken = recaptchaToken;
		grecaptcha.reset()
	}
	var customizations = [];
	var customizationFieldIds = [];
	var filesToRead = [];
	jQuery('[name^="customizationFields"]').each(function (index, element) {
		var fieldElement = jQuery(element);
		var inputType = fieldElement.attr("data-customization-field-type");
		var inputId = fieldElement.attr("data-customization-field-id");
		if (customizationFieldIds.indexOf(inputId) >= 0) {
			return
		}
		customizationFieldIds.push(inputId);
		var inputValue;
		switch (inputType) {
			case "textbox":
			case "textarea":
			case "dropdown":
				inputValue = fieldElement.val().trim();
				if (inputType == "textbox" || inputType == "textarea") {
					if (inputValue.length > 0 && fieldElement.attr("data-min_length").length > 0) {
						if (inputValue.length < parseInt(fieldElement.attr("data-min_length"))) {
							throw "Sepete eklemek istediÄŸiniz Ã¼rÃ¼n iÃ§in girdiÄŸiniz " + fieldElement.attr("data-customization-field-name") + " deÄŸeri minimum " + fieldElement.attr("data-min_length") + " karakter olmalÄ±dÄ±r."
						}
					}
					if (fieldElement.attr("data-max_length").length > 0) {
						if (inputValue.length > parseInt(fieldElement.attr("data-max_length"))) {
							throw "Sepete eklemek istediÄŸiniz Ã¼rÃ¼n iÃ§in girdiÄŸiniz " + fieldElement.attr("data-customization-field-name") + " deÄŸeri maximum " + fieldElement.attr("data-max_length") + " karakter olmalÄ±dÄ±r."
						}
					}
				}
				if (inputValue) {
					customizations.push({
						"id": inputId,
						"value": inputValue
					})
				}
				break;
			case "radio":
				var checkedElement = jQuery('[name="customizationFields[' + inputId + ']"]:checked');
				if (checkedElement) {
					inputValue = checkedElement.val();
					if (inputValue) {
						customizations.push({
							"id": inputId,
							"value": inputValue
						})
					}
				}
				break;
			case "checkbox":
				jQuery('[name="customizationFields[' + inputId + '][]"]:checked').each(function (index, checkboxElement) {
					checkboxElement = jQuery(checkboxElement);
					if (!checkboxElement.is(":checked")) {
						return
					}
					inputValue = checkboxElement.val().trim();
					if (inputValue) {
						var customizationValue = {
							"id": inputId,
							"value": inputValue
						};
						customizations.push(customizationValue)
					}
				});
				break;
			case "file":
				for (var i = 0; i < element.files.length; i++) {
					var file = element.files[i];
					ideacart1.CheckCustomizationFileSize(file);
					ideacart1.CheckCustomizationFileExtension(file);
					ideacart1.CheckCustomizationFileMimeType(file);
					filesToRead.push(file);
					var reader = new FileReader();
					reader.onload = function (readEvent) {
						var target = readEvent.target;
						if (target.readyState == 2) {
							filesToRead.splice(filesToRead.indexOf(file), 1);
							customizations.push({
								"id": inputId,
								"value": file.name,
								"file_content": target.result
							})
						}
					};
					reader.readAsDataURL(file)
				}
				break
		}
	});
	if (jQuery('input[name^="customizationFields"][type=file][value!=""]').length > 0) {
		(function waitForIt() {
			if (!isCartReadingAnyFile) {
				isCartReadingAnyFile = true;
				jQuery("#sepet_butonlari").prepend('<div class="addCartProductLoading"><div><img src="images/spinner.gif"/></div><div>ÃœrÃ¼n sepete ekleniyor. LÃ¼tfen bekleyiniz...</div></div>')
			}
			setTimeout(function () {
				if (filesToRead.length > 0) {
					waitForIt()
				} else {
					postParams.customizations = customizations;
					try {
						SendRequest("/cart/add_item", postParams)
					} catch (error) {
						alert(error);
						window.location.reload();
						return
					}
					if (parseInt(additionalCartUpdateDisable)) {
						window.location = "/index.php?do=catalog/order"
					}
					jQuery("#sepet_butonlari .addCartProductLoading").remove();
					isCartReadingAnyFile = false;
					shoppingCartInformationBox(lastExtraButtonType)
				}
			}, 1000)
		})()
	} else {
		postParams.customizations = customizations;
		try {
			SendRequest("/cart/add_item", postParams);
			if (parseInt(additionalCartUpdateDisable)) {
				window.location = "/index.php?do=catalog/order"
			}
			return true
		} catch (error) {
			if (error.indexOf("Ã¶zelleÅŸtirme bilgisi gereklidir") > 0) {
				alert(error);
				window.location = "/index.php?do=product/view&pid=" + productId;
				return false
			}
			if (error.indexOf("Ã¼rÃ¼n iÃ§in bir Ã¶zelliÄŸin seÃ§ilmesi gerekmektedir") > 0) {
				alert(error);
				window.location = "/index.php?do=catalog/product&pid=" + productId;
				return false
			}
			throw error
		}
	}
}

function DeleteCartItemFromCart(id, purgeCartItem) {
	var cartItemObject = id.split("_");
	var productId = cartItemObject[0];
	var attributeIndex = cartItemObject[1];
	var postParams = {};
	postParams.productId = productId;
	postParams.attributeIndex = attributeIndex;
	if (purgeCartItem == true) {
		postParams.purgeCartItem = 1
	}
	SendRequest("/cart/remove_item_via_product_id", postParams)
}

function FlushCart() {}

function SaveCart() {
	return true
}

function SendRequest(url, postParams) {
	var returnData = false;
	if (typeof postParams == "undefined") {
		postParams = {}
	}
	postParams.anticsrf = jQuery("#cart-anticsrf").val();
	jQuery.ajax({
		type: "POST",
		url: url,
		data: postParams,
		success: function (data) {
			returnData = data
		},
		error: function (xhr, textStatus, error) {
			var parsedResponse = null;
			var defaultErrorMessage = "Sepet bilgisi kaydedilemedi. LÃ¼tfen daha sonra tekrar deneyiniz.";
			try {
				parsedResponse = jQuery.parseJSON(xhr.responseText)
			} catch (parseError) {
				throw defaultErrorMessage
			}
			if (parsedResponse.errorMessage) {
				throw parsedResponse.errorMessage
			}
			throw defaultErrorMessage
		},
		dataType: "json",
		async: false
	});
	return returnData
}

function shoppingCartInformationBox(t) {
	jQuery("body").append('<div class="shopping-cart-information-box"><div class="shopping-cart-information-box-title">Bilgilendirme<a href="javascript:addToCartInformation();">x</a></div><div class="shopping-cart-information-box-content"><p>ÃœrÃ¼n Sepetinize EklenmiÅŸtir.</p><a href="/sepet">Sepete Git</a></div></div>');
	setTimeout(function () {
		addToCartInformation()
	}, 3000)
}

function addToCartInformation() {
	jQuery(".shopping-cart-information-box").remove()
}(function ($) {
	if (typeof hasDataAttribute == "function" && !hasDataAttribute("usesearchautocomplete")) {
		return
	}
	$.fn.bgIframe = $.fn.bgiframe = function (s) {
		if ($.browser.msie && parseInt($.browser.version) <= 6) {
			s = $.extend({
				top: "auto",
				left: "auto",
				width: "auto",
				height: "auto",
				opacity: true,
				src: "javascript:false;"
			}, s || {});
			var prop = function (n) {
					return n && n.constructor == Number ? n + "px" : n
				},
				html = '<iframe class="bgiframe"frameborder="0"tabindex="-1"src="' + s.src + '"' + 'style="display:block;position:absolute;z-index:-1;' + (s.opacity !== false ? "filter:Alpha(Opacity='0');" : "") + "top:" + (s.top == "auto" ? "expression(((parseInt(this.parentNode.currentStyle.borderTopWidth)||0)*-1)+'px')" : prop(s.top)) + ";" + "left:" + (s.left == "auto" ? "expression(((parseInt(this.parentNode.currentStyle.borderLeftWidth)||0)*-1)+'px')" : prop(s.left)) + ";" + "width:" + (s.width == "auto" ? "expression(this.parentNode.offsetWidth+'px')" : prop(s.width)) + ";" + "height:" + (s.height == "auto" ? "expression(this.parentNode.offsetHeight+'px')" : prop(s.height)) + ";" + '"/>';
			return this.each(function () {
				if ($("> iframe.bgiframe", this).length == 0) {
					this.insertBefore(document.createElement(html), this.firstChild)
				}
			})
		}
		return this
	};
	if (!$.browser.version) {
		$.browser.version = navigator.userAgent.toLowerCase().match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/)[1]
	}
})(jQuery);
(function ($) {
	$.fn.extend({
		autocomplete: function (urlOrData, options) {
			var isUrl = typeof urlOrData == "string";
			options = $.extend({}, $.Autocompleter.defaults, {
				url: isUrl ? urlOrData : null,
				data: isUrl ? null : urlOrData,
				delay: isUrl ? $.Autocompleter.defaults.delay : 10,
				max: options && !options.scroll ? 10 : 150
			}, options);
			options.highlight = options.highlight || function (value) {
				return value
			};
			options.formatMatch = options.formatMatch || options.formatItem;
			return this.each(function () {
				new $.Autocompleter(this, options)
			})
		},
		result: function (handler) {
			return this.bind("result", handler)
		},
		search: function (handler) {
			return this.trigger("search", [handler])
		},
		flushCache: function () {
			return this.trigger("flushCache")
		},
		setOptions: function (options) {
			return this.trigger("setOptions", [options])
		},
		unautocomplete: function () {
			return this.trigger("unautocomplete")
		}
	});
	$.Autocompleter = function (input, options) {
		var KEY = {
			UP: 38,
			DOWN: 40,
			DEL: 46,
			TAB: 9,
			RETURN: 13,
			ESC: 27,
			COMMA: 188,
			PAGEUP: 33,
			PAGEDOWN: 34,
			BACKSPACE: 8
		};
		var $input = $(input).attr("autocomplete", "off").addClass(options.inputClass);
		var $ajx = null;
		var timeout;
		var previousValue = "";
		var cache = $.Autocompleter.Cache(options);
		var hasFocus = 0;
		var lastKeyPressCode;
		var config = {
			mouseDownOnSelect: false
		};
		var select = $.Autocompleter.Select(options, input, selectCurrent, config);
		var blockSubmit;
		$.browser.opera && $(input.form).bind("submit.autocomplete", function () {
			if (blockSubmit) {
				blockSubmit = false;
				return false
			}
		});
		$input.bind(($.browser.opera ? "keypress" : "keydown") + ".autocomplete", function (event) {
			lastKeyPressCode = event.keyCode;
			switch (event.keyCode) {
				case KEY.UP:
					event.preventDefault();
					if (select.visible()) {
						select.prev()
					} else {
						onChange(0, true)
					}
					break;
				case KEY.DOWN:
					event.preventDefault();
					if (select.visible()) {
						select.next()
					} else {
						onChange(0, true)
					}
					break;
				case KEY.PAGEUP:
					event.preventDefault();
					if (select.visible()) {
						select.pageUp()
					} else {
						onChange(0, true)
					}
					break;
				case KEY.PAGEDOWN:
					event.preventDefault();
					if (select.visible()) {
						select.pageDown()
					} else {
						onChange(0, true)
					}
					break;
				case options.multiple && $.trim(options.multipleSeparator) == "," && KEY.COMMA:
				case KEY.TAB:
				case KEY.RETURN:
					if (selectCurrent()) {
						event.preventDefault();
						blockSubmit = true;
						return false
					}
					break;
				case KEY.ESC:
					select.hide();
					break;
				default:
					clearTimeout(timeout);
					timeout = setTimeout(onChange, options.delay);
					break
			}
		}).focus(function () {
			hasFocus = 0;
			if (!config.mouseDownOnSelect) {
				hideResults()
			}
		}).blur(function () {
			hasFocus = 0;
			if (!config.mouseDownOnSelect) {
				hideResults()
			}
		}).click(function () {
			hasFocus = 0;
			hideResults();
			hasFocus++;
			if (hasFocus > 1 && !select.visible()) {}
		}).bind("search", function () {
			var fn = (arguments.length > 1) ? arguments[1] : null;

			function findValueCallback(q, data) {
				var result;
				if (data && data.length) {
					for (var i = 0; i < data.length; i++) {
						if (data[i].result.toLowerCase() == q.toLowerCase()) {
							result = data[i];
							break
						}
					}
				}
				if (typeof fn == "function") {
					fn(result)
				} else {
					$input.trigger("result", result && [result.data, result.value])
				}
			}
			$.each(trimWords($input.val()), function (i, value) {
				request(value, findValueCallback, findValueCallback)
			})
		}).bind("flushCache", function () {
			cache.flush()
		}).bind("setOptions", function () {
			$.extend(options, arguments[1]);
			if ("data" in arguments[1]) {
				cache.populate()
			}
		}).bind("unautocomplete", function () {
			select.unbind();
			$input.unbind();
			$(input.form).unbind(".autocomplete")
		});

		function selectCurrent() {
			var selected = select.selected();
			if (!selected) {
				return false
			}
			if (selected.url != "") {
				top.location = selected.url
			}
			var v = selected.result;
			previousValue = v;
			if (options.multiple) {
				var words = trimWords($input.val());
				if (words.length > 1) {
					v = words.slice(0, words.length - 1).join(options.multipleSeparator) + options.multipleSeparator + v
				}
				v += options.multipleSeparator
			}
			$input.val(v);
			hideResultsNow();
			$input.trigger("result", [selected.data, selected.value]);
			return true
		}

		function onChange(crap, skipPrevCheck) {
			if (lastKeyPressCode == KEY.DEL) {
				select.hide();
				return
			}
			var currentValue = $input.val();
			if (!skipPrevCheck && currentValue == previousValue) {
				return
			}
			previousValue = currentValue;
			currentValue = lastWord(currentValue);
			if (currentValue.length >= options.minChars) {
				$input.after('<div class="' + options.loadingClass + '"> </div>');
				if (!options.matchCase) {
					currentValue = currentValue.toLowerCase()
				}
				request(currentValue, receiveData, hideResultsNow)
			} else {
				stopLoading();
				select.hide()
			}
		}

		function trimWords(value) {
			if (!value) {
				return [""]
			}
			var words = value.split(options.multipleSeparator);
			var result = [];
			$.each(words, function (i, value) {
				if ($.trim(value)) {
					result[i] = $.trim(value)
				}
			});
			return result
		}

		function lastWord(value) {
			if (!options.multiple) {
				return value
			}
			var words = trimWords(value);
			return words[words.length - 1]
		}

		function autoFill(q, sValue) {
			if (options.autoFill && (lastWord($input.val()).toLowerCase() == q.toLowerCase()) && lastKeyPressCode != KEY.BACKSPACE) {
				$input.val($input.val() + sValue.substring(lastWord(previousValue).length));
				$.Autocompleter.Selection(input, previousValue.length, previousValue.length + sValue.length)
			}
		}

		function hideResults() {
			clearTimeout(timeout);
			timeout = setTimeout(hideResultsNow, 200)
		}

		function hideResultsNow() {
			var wasVisible = select.visible();
			select.hide();
			clearTimeout(timeout);
			stopLoading();
			if (options.mustMatch) {
				$input.search(function (result) {
					if (!result) {
						if (options.multiple) {
							var words = trimWords($input.val()).slice(0, -1);
							$input.val(words.join(options.multipleSeparator) + (words.length ? options.multipleSeparator : ""))
						} else {
							$input.val("")
						}
					}
				})
			}
			if (wasVisible) {
				$.Autocompleter.Selection(input, input.value.length, input.value.length)
			}
		}

		function receiveData(q, data) {
			if (data && data.length) {
				stopLoading();
				select.display(data, q);
				autoFill(q, data[0].value);
				select.show()
			} else {
				hideResultsNow()
			}
		}

		function request(term, success, failure) {
			if (!options.matchCase) {
				term = term.toLowerCase()
			}
			var data = cache.load(term);
			if (data && data.length) {
				success(term, data)
			} else {
				if ((typeof options.url == "string") && (options.url.length > 0)) {
					var extraParams = {
						timestamp: +new Date()
					};
					$.each(options.extraParams, function (key, param) {
						extraParams[key] = typeof param == "function" ? param() : param
					});
					if ($ajx != null) {
						$ajx.abort();
						$("." + options.loadingClass + ":eq(0)").remove()
					}
					$ajx = $.ajax({
						mode: "abort",
						port: "autocomplete" + input.name,
						dataType: options.dataType,
						url: options.url,
						data: $.extend({
							q: lastWord(term),
							limit: options.max
						}, extraParams),
						success: function (data) {
							var parsed = options.parse && options.parse(data) || parse(data);
							cache.add(term, parsed);
							success(term, parsed);
							$ajx = null
						}
					})
				} else {
					select.emptyList();
					failure(term)
				}
			}
		}

		function parse(data) {
			var parsed = [];
			var rows = data.split("\n");
			for (var i = 0; i < rows.length; i++) {
				var row = $.trim(rows[i]);
				if (row) {
					row = row.split("|");
					parsed[parsed.length] = {
						data: row,
						value: row[0],
						result: options.formatResult && options.formatResult(row, row[0]) || row[0]
					}
				}
			}
			return parsed
		}

		function stopLoading() {
			$("." + options.loadingClass).remove()
		}
	};
	$.Autocompleter.defaults = {
		inputClass: "ac_input",
		resultsClass: "ac_results",
		loadingClass: "ac_loading",
		minChars: 1,
		delay: 400,
		matchCase: false,
		matchSubset: true,
		matchContains: false,
		cacheLength: 10,
		max: 100,
		mustMatch: false,
		extraParams: {},
		selectFirst: true,
		formatItem: function (row) {
			return row[0]
		},
		formatMatch: null,
		autoFill: false,
		width: 0,
		multiple: false,
		multipleSeparator: ", ",
		highlight: function (value, term) {
			return value.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + term.replace(/([\^\$\(\)\[\]\{\}\*\.\+\?\|\\])/gi, "\\$1") + ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<strong>$1</strong>")
		},
		scroll: true,
		scrollHeight: 180
	};
	$.Autocompleter.Cache = function (options) {
		var data = {};
		var length = 0;

		function matchSubset(s, sub) {
			if (!options.matchCase) {
				s = s.toLowerCase()
			}
			var i = s.indexOf(sub);
			if (options.matchContains == "word") {
				i = s.toLowerCase().search("\\b" + sub.toLowerCase())
			}
			if (i == -1) {
				return false
			}
			return i == 0 || options.matchContains
		}

		function add(q, value) {
			if (length > options.cacheLength) {
				flush()
			}
			if (!data[q]) {
				length++
			}
			data[q] = value
		}

		function populate() {
			if (!options.data) {
				return false
			}
			var stMatchSets = {},
				nullData = 0;
			if (!options.url) {
				options.cacheLength = 1
			}
			stMatchSets[""] = [];
			for (var i = 0, ol = options.data.length; i < ol; i++) {
				var rawValue = options.data[i];
				rawValue = (typeof rawValue == "string") ? [rawValue] : rawValue;
				var value = options.formatMatch(rawValue, i + 1, options.data.length);
				if (value === false) {
					continue
				}
				var firstChar = value.charAt(0).toLowerCase();
				if (!stMatchSets[firstChar]) {
					stMatchSets[firstChar] = []
				}
				var row = {
					value: value,
					data: rawValue,
					result: options.formatResult && options.formatResult(rawValue) || value
				};
				stMatchSets[firstChar].push(row);
				if (nullData++ < options.max) {
					stMatchSets[""].push(row)
				}
			}
			$.each(stMatchSets, function (i, value) {
				options.cacheLength++;
				add(i, value)
			})
		}
		setTimeout(populate, 25);

		function flush() {
			data = {};
			length = 0
		}
		return {
			flush: flush,
			add: add,
			populate: populate,
			load: function (q) {
				if (!options.cacheLength || !length) {
					return null
				}
				if (!options.url && options.matchContains) {
					var csub = [];
					for (var k in data) {
						if (k.length > 0) {
							var c = data[k];
							$.each(c, function (i, x) {
								if (matchSubset(x.value, q)) {
									csub.push(x)
								}
							})
						}
					}
					return csub
				} else {
					if (data[q]) {
						return data[q]
					} else {
						if (options.matchSubset) {
							for (var i = q.length - 1; i >= options.minChars; i--) {
								var c = data[q.substr(0, i)];
								if (c) {
									var csub = [];
									$.each(c, function (i, x) {
										if (matchSubset(x.value, q)) {
											csub[csub.length] = x
										}
									});
									return csub
								}
							}
						}
					}
				}
				return null
			}
		}
	};
	$.Autocompleter.Select = function (options, input, select, config) {
		var CLASSES = {
			ACTIVE: "ac_over"
		};
		var listItems, active = -1,
			data, term = "",
			needsInit = true,
			element, list;

		function init() {
			if (!needsInit) {
				return
			}
			element = $("<div/>").hide().addClass(options.resultsClass).css("position", "absolute").appendTo(document.body);
			list = $("<ul/>").appendTo(element).mouseover(function (event) {
				if (target(event).nodeName && target(event).nodeName.toUpperCase() == "LI") {
					active = $("li", list).removeClass(CLASSES.ACTIVE).index(target(event));
					$(target(event)).addClass(CLASSES.ACTIVE)
				}
			}).click(function (event) {
				$(target(event)).addClass(CLASSES.ACTIVE);
				select();
				input.focus();
				return false
			}).mousedown(function () {
				config.mouseDownOnSelect = true
			}).mouseup(function () {
				config.mouseDownOnSelect = false
			});
			if (options.width > 0) {
				element.css("width", options.width)
			}
			needsInit = false
		}

		function target(event) {
			var element = event.target;
			while (element && element.tagName != "LI") {
				element = element.parentNode
			}
			if (!element) {
				return []
			}
			return element
		}

		function moveSelect(step) {
			listItems.slice(active, active + 1).removeClass(CLASSES.ACTIVE);
			movePosition(step);
			var activeItem = listItems.slice(active, active + 1).addClass(CLASSES.ACTIVE);
			if (options.scroll) {
				var offset = 0;
				listItems.slice(0, active).each(function () {
					offset += this.offsetHeight
				});
				if ((offset + activeItem[0].offsetHeight - list.scrollTop()) > list[0].clientHeight) {
					list.scrollTop(offset + activeItem[0].offsetHeight - list.innerHeight())
				} else {
					if (offset < list.scrollTop()) {
						list.scrollTop(offset)
					}
				}
			}
		}

		function movePosition(step) {
			active += step;
			if (active < 0) {
				active = listItems.size() - 1
			} else {
				if (active >= listItems.size()) {
					active = 0
				}
			}
		}

		function limitNumberOfItems(available) {
			return options.max && options.max < available ? options.max : available
		}

		function fillList() {
			list.empty();
			var max = limitNumberOfItems(data.length);
			for (var i = 0; i < max; i++) {
				if (!data[i]) {
					continue
				}
				var formatted = options.formatItem(data[i], i + 1, max, data[i].value, term);
				if (formatted === false) {
					continue
				}
				var li = $("<li/>").html(options.highlight(formatted, term)).addClass(i % 2 == 0 ? "ac_even" : "ac_odd").appendTo(list)[0];
				$.data(li, "ac_data", data[i])
			}
			listItems = list.find("li");
			if (options.selectFirst) {
				listItems.slice(0, 1).addClass(CLASSES.ACTIVE);
				active = 0
			}
			if ($.fn.bgiframe) {
				list.bgiframe()
			}
		}
		return {
			display: function (d, q) {
				init();
				data = d;
				term = q;
				fillList()
			},
			next: function () {
				moveSelect(1)
			},
			prev: function () {
				moveSelect(-1)
			},
			pageUp: function () {
				if (active != 0 && active - 8 < 0) {
					moveSelect(-active)
				} else {
					moveSelect(-8)
				}
			},
			pageDown: function () {
				if (active != listItems.size() - 1 && active + 8 > listItems.size()) {
					moveSelect(listItems.size() - 1 - active)
				} else {
					moveSelect(8)
				}
			},
			hide: function () {
				element && element.hide();
				listItems && listItems.removeClass(CLASSES.ACTIVE);
				active = -1
			},
			visible: function () {
				return element && element.is(":visible")
			},
			current: function () {
				return this.visible() && (listItems.filter("." + CLASSES.ACTIVE)[0] || options.selectFirst && listItems[0])
			},
			show: function () {
				var offset = $(input).offset();
				element.css({
					width: typeof options.width == "string" || options.width > 0 ? options.width : (input.offsetWidth < 200 ? 200 : input.offsetWidth),
					top: offset.top + input.offsetHeight,
					left: offset.left
				}).show();
				if (options.scroll) {
					list.scrollTop(0);
					list.css({
						maxHeight: options.scrollHeight,
						overflow: "auto"
					});
					if ($.browser.msie && document.body.style.maxHeight < 1) {
						var listHeight = 0;
						listItems.each(function () {
							listHeight += this.offsetHeight
						});
						var scrollbarsVisible = listHeight > options.scrollHeight;
						list.css("height", scrollbarsVisible ? options.scrollHeight : listHeight);
						if (!scrollbarsVisible) {
							listItems.width(list.width() - parseInt(listItems.css("padding-left")) - parseInt(listItems.css("padding-right")))
						}
					}
				}
			},
			selected: function () {
				var selected = listItems && listItems.filter("." + CLASSES.ACTIVE).removeClass(CLASSES.ACTIVE);
				return selected && selected.length && $.data(selected[0], "ac_data")
			},
			emptyList: function () {
				list && list.empty()
			},
			unbind: function () {
				element && element.remove()
			}
		}
	};
	$.Autocompleter.Selection = function (field, start, end) {
		if (field.createTextRange) {
			var selRange = field.createTextRange();
			selRange.collapse(true);
			selRange.moveStart("character", start);
			selRange.moveEnd("character", end);
			selRange.select()
		} else {
			if (field.setSelectionRange) {
				field.setSelectionRange(start, end)
			} else {
				if (field.selectionStart) {
					field.selectionStart = start;
					field.selectionEnd = end
				}
			}
		}
	}
})(jQuery);

function Parsed(data) {
	data = window.eval(data);
	jQuery.each(data, function (i, val) {
		data[i].value = data[i].result = val.label
	});
	return data
}

function formatItem(data) {
	var format = "";
	if (data.image) {
		if (data.url) {
			format += '<a href="' + data.url + '">'
		}
		format += '<div class="autoSearchItem autoSclearfix"><div class="asItemLeft"><img src="' + data.image + '" border="0" alt="" /></div><div class="asItemRight">' + data.label + "</div></div>";
		if (data.url) {
			format += "</a>"
		}
	} else {
		if (data.label) {
			if (data.url) {
				format += '<a class="autoSearchLink" href="' + data.url + '">'
			}
			format += '<span class="autoSearchText">' + data.label + "</span>";
			if (data.url) {
				format += "</a>"
			}
		}
	}
	return format
}
jQuery().ready(function () {
	if (typeof hasDataAttribute == "function" && !hasDataAttribute("usesearchautocomplete")) {
		return
	}
	jQuery(".QuickSearchBar, .SearchBar").autocomplete("/index.php", {
		extraParams: {
			"do": "catalog/search.ajax"
		},
		minChars: 3,
		width: 0,
		multiple: false,
		matchContains: true,
		parse: Parsed,
		formatItem: formatItem,
		inputClass: "ac_input",
		resultsClass: "ac_results",
		loadingClass: "ac_loading",
		delay: 250,
		matchCase: false,
		matchSubset: false,
		cacheLength: 10,
		mustMatch: false,
		selectFirst: true,
		max: 10,
		autoFill: false,
		multipleSeparator: ", "
	})
});
(function ($, window, document, undefined) {
	var $window = $(window);
	$.fn.lazyload = function (options) {
		if (typeof hasDataAttribute == "function" && !hasDataAttribute("uselazyload")) {
			return
		}
		var elements = this;
		var $container;
		var settings = {
			threshold: 0,
			failure_limit: 0,
			event: "scroll",
			effect: "show",
			container: window,
			data_attribute: "original",
			skip_invisible: true,
			appear: null,
			load: null,
			placeholder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC"
		};

		function update() {
			var counter = 0;
			elements.each(function () {
				var $this = $(this);
				if (settings.skip_invisible && !$this.is(":visible")) {
					return
				}
				if ($.abovethetop(this, settings) || $.leftofbegin(this, settings)) {} else {
					if (!$.belowthefold(this, settings) && !$.rightoffold(this, settings)) {
						$this.trigger("appear");
						counter = 0
					} else {
						if (++counter > settings.failure_limit) {
							return false
						}
					}
				}
			})
		}
		if (options) {
			if (undefined !== options.failurelimit) {
				options.failure_limit = options.failurelimit;
				delete options.failurelimit
			}
			if (undefined !== options.effectspeed) {
				options.effect_speed = options.effectspeed;
				delete options.effectspeed
			}
			$.extend(settings, options)
		}
		$container = (settings.container === undefined || settings.container === window) ? $window : $(settings.container);
		if (0 === settings.event.indexOf("scroll")) {
			$container.bind(settings.event, function () {
				return update()
			})
		}
		this.each(function () {
			var self = this;
			var $self = $(self);
			self.loaded = false;
			if ($self.attr("src") === undefined || $self.attr("src") === false) {
				$self.attr("src", settings.placeholder)
			}
			$self.one("appear", function () {
				if (!this.loaded) {
					if (settings.appear) {
						var elements_left = elements.length;
						settings.appear.call(self, elements_left, settings)
					}
					$("<img />").bind("load", function () {
						var original = $self.data(settings.data_attribute);
						$self.hide();
						if ($self.is("img")) {
							$self.attr("src", original)
						} else {
							$self.css("background-image", "url('" + original + "')")
						}
						$self[settings.effect](settings.effect_speed);
						self.loaded = true;
						var temp = $.grep(elements, function (element) {
							return !element.loaded
						});
						elements = $(temp);
						if (settings.load) {
							var elements_left = elements.length;
							settings.load.call(self, elements_left, settings)
						}
					}).attr("src", $self.data(settings.data_attribute))
				}
			});
			if (0 !== settings.event.indexOf("scroll")) {
				$self.bind(settings.event, function () {
					if (!self.loaded) {
						$self.trigger("appear")
					}
				})
			}
		});
		$window.bind("resize", function () {
			update()
		});
		if ((/iphone|ipod|ipad.*os 5/gi).test(navigator.appVersion)) {
			$window.bind("pageshow", function (event) {
				if (event.originalEvent && event.originalEvent.persisted) {
					elements.each(function () {
						$(this).trigger("appear")
					})
				}
			})
		}
		$(document).ready(function () {
			update()
		});
		return this
	};
	$.belowthefold = function (element, settings) {
		var fold;
		if (settings.container === undefined || settings.container === window) {
			fold = (window.innerHeight ? window.innerHeight : $window.height()) + $window.scrollTop()
		} else {
			fold = $(settings.container).offset().top + $(settings.container).height()
		}
		return fold <= $(element).offset().top - settings.threshold
	};
	$.rightoffold = function (element, settings) {
		var fold;
		if (settings.container === undefined || settings.container === window) {
			fold = $window.width() + $window.scrollLeft()
		} else {
			fold = $(settings.container).offset().left + $(settings.container).width()
		}
		return fold <= $(element).offset().left - settings.threshold
	};
	$.abovethetop = function (element, settings) {
		var fold;
		if (settings.container === undefined || settings.container === window) {
			fold = $window.scrollTop()
		} else {
			fold = $(settings.container).offset().top
		}
		return fold >= $(element).offset().top + settings.threshold + $(element).height()
	};
	$.leftofbegin = function (element, settings) {
		var fold;
		if (settings.container === undefined || settings.container === window) {
			fold = $window.scrollLeft()
		} else {
			fold = $(settings.container).offset().left
		}
		return fold >= $(element).offset().left + settings.threshold + $(element).width()
	};
	$.inviewport = function (element, settings) {
		return !$.rightoffold(element, settings) && !$.leftofbegin(element, settings) && !$.belowthefold(element, settings) && !$.abovethetop(element, settings)
	};
	$.extend($.expr[":"], {
		"below-the-fold": function (a) {
			return $.belowthefold(a, {
				threshold: 0
			})
		},
		"above-the-top": function (a) {
			return !$.belowthefold(a, {
				threshold: 0
			})
		},
		"right-of-screen": function (a) {
			return $.rightoffold(a, {
				threshold: 0
			})
		},
		"left-of-screen": function (a) {
			return !$.rightoffold(a, {
				threshold: 0
			})
		},
		"in-viewport": function (a) {
			return $.inviewport(a, {
				threshold: 0
			})
		},
		"above-the-fold": function (a) {
			return !$.belowthefold(a, {
				threshold: 0
			})
		},
		"right-of-fold": function (a) {
			return $.rightoffold(a, {
				threshold: 0
			})
		},
		"left-of-fold": function (a) {
			return !$.rightoffold(a, {
				threshold: 0
			})
		}
	})
})(jQuery, window, document);
(function () {
	jQuery.fn.SmartSlider = function (options) {
		var options = jQuery.extend({
			sliderWidth: 1200,
			sliderHeight: 300,
			autoStart: true,
			autoStartTime: 4000,
			effectTime: 1000,
			definitionEffectTime: 200,
			sliderEffect: "slide",
			showButton: false,
			pagination: false,
			paginationNumeric: true,
			definition: true,
			definitionVerticalPosition: "top",
			definitionHorizontalPosition: "right",
			definitionVerticalSpace: "20",
			definitionHorizontalSpace: "20",
			definitionFontFamily: {
				"arial": "Arial, Helvetica, sans-serif",
				"tahoma": "Tahoma, Geneva, sans-serif",
				"verdana": "Verdana, Geneva, sans-serif",
				"georgia": "Georgia, serif",
				"trebuchet": "'Trebuchet MS', Helvetica, sans-serif",
				"courier": "Courier, monospace",
				"timesnewroman": "'Times New Roman', Times, serif"
			},
			definitionFontFamilySelect: "courier",
			definitionFontColor: {
				"red": "#ff0000",
				"cyan": "#00ffff",
				"blue": "#0000ff",
				"purple": "#FF34B3",
				"yellow": "#ffff00",
				"white": "#ffffff",
				"silver": "#E6E8FA",
				"black": "#000000",
				"orange": "#ffa500",
				"brown": "#8B4513",
				"green": "#008000"
			},
			definitionFontColorSelect: "white",
			definitionFontFamilySize: 18,
			definitionBackgroundColor: "#9c9c9c",
			previousNextSize: "20",
			previousNextColor: "#9c9c9c",
			previousNextOpacity: "70",
			bulletActiveColor: "#464646",
			bulletPassiveColor: "#7f7f7f",
			bulletActiveFontColor: "#ffffff",
			bulletPassiveFontColor: "#999999",
			bulletClass: "_bullet",
			bulletActiveClass: "_bulletActive",
			sliderWrapper: this,
			sliderItemContainer: this.find("._sliderItemContainer"),
			sliderItem: this.find("._sliderItem"),
			imageActive: "_imageActive",
			definitionClass: "_definition",
			next: "_next",
			previous: "_previous"
		}, options);
		return jQuery(this).each(function () {
			var el = this;
			var totalImage = jQuery(options.sliderItem).length;
			var imageWidth = options.sliderWidth;
			var imageHeight = options.sliderHeight;
			var totalImageWidth = (imageWidth * totalImage);
			createSlide = function (argSliderContainer, argSliderItem, argSliderEffect) {
				slideProperties = function (argSliderContainer, argSliderItem) {
					var ImageDataNumber = 1;
					jQuery(argSliderItem).each(function () {
						jQuery(this).attr("id", "_imageData-" + ImageDataNumber);
						ImageDataNumber++
					});
					if (options.showButton == true) {
						var previous = jQuery('<div class="' + options.previous + '" style="margin-top:-' + options.previousNextSize + "px;border-right-color:" + options.previousNextColor + ";border-top-width:" + options.previousNextSize + "px;border-bottom-width:" + options.previousNextSize + "px;border-right-width:" + options.previousNextSize + "px;opacity:" + options.previousNextOpacity / 100 + ";filter:alpha(opacity=" + options.previousNextOpacity + ');"></div>');
						var next = jQuery('<div class="' + options.next + '" style="margin-top:-' + options.previousNextSize + "px;border-left-color:" + options.previousNextColor + ";border-top-width:" + options.previousNextSize + "px;border-bottom-width:" + options.previousNextSize + "px;border-left-width:" + options.previousNextSize + "px;opacity:" + options.previousNextOpacity / 100 + ";filter:alpha(opacity=" + options.previousNextOpacity + ');"></div>');
						jQuery(options.sliderWrapper).append(next).append(previous)
					}
					jQuery(argSliderItem).eq(0).addClass(options.imageActive);
					if (options.sliderEffect == "fade") {
						jQuery(el).css({
							"position": "relative",
							"overflow": "hidden",
							"width": imageWidth + "px ",
							"height": imageHeight + "px"
						});
						jQuery(argSliderContainer).css({
							"position": "absolute",
							"top": "0px",
							"left": "0px"
						});
						jQuery(argSliderItem).css({
							"position": "absolute",
							"left": "0px",
							"top": "0px",
							"width": imageWidth + "px ",
							"height": imageHeight + "px",
							"display": "none"
						});
						jQuery(argSliderItem).eq(0).fadeIn(options.effectTime)
					} else {
						if (options.sliderEffect == "slide") {
							jQuery(el).css({
								"position": "relative",
								"overflow": "hidden",
								"width": imageWidth + "px ",
								"height": imageHeight + "px"
							});
							jQuery(argSliderContainer).css({
								"position": "absolute",
								"width": totalImageWidth + "px ",
								"height": imageHeight + "px",
								"top": "0px",
								"left": "0px"
							});
							jQuery(argSliderItem).css({
								"float": "left",
								"width": imageWidth + "px ",
								"height": imageHeight + "px"
							})
						} else {
							if (options.sliderEffect == "") {
								jQuery(el).css({
									"position": "relative",
									"overflow": "hidden",
									"width": imageWidth + "px ",
									"height": imageHeight + "px"
								});
								jQuery(argSliderContainer).css({
									"position": "absolute",
									"top": "0px",
									"left": "0px"
								});
								jQuery(argSliderItem).css({
									"position": "absolute",
									"left": "0px",
									"top": "0px",
									"width": imageWidth + "px ",
									"height": imageHeight + "px",
									"display": "none"
								});
								jQuery(argSliderItem).eq(0).fadeIn(options.effectTime)
							}
						}
					}
					if (options.pagination == true) {
						var paginationHtml = "",
							i;
						if (options.paginationNumeric == true) {
							jQuery(options.sliderWrapper).append('<div class="' + options.bulletClass + '"></div>');
							for (i = 1; i < (totalImage + 1); i++) {
								paginationHtml = paginationHtml + '<a href="javascript:void(0)">' + i + "</a>"
							}
							jQuery(el).find("." + options.bulletClass).append(paginationHtml)
						} else {
							jQuery(options.sliderWrapper).append('<div class="' + options.bulletClass + '"></div>');
							for (i = 0; i < totalImage; i++) {
								paginationHtml = paginationHtml + '<a href="javascript:void(0)"></a>'
							}
							jQuery(el).find("." + options.bulletClass).append(paginationHtml)
						}
					}
					if (options.pagination == true) {
						jQuery(el).find("." + options.bulletClass + " a").eq(0).addClass(options.bulletActiveClass);
						jQuery(el).find("." + options.bulletClass + " a").click(function () {
							bulletRange = jQuery(this).index();
							jQuery("." + options.bulletClass + " a").removeClass(options.bulletActiveClass);
							jQuery(this).addClass(options.bulletActiveClass);
							jQuery(options.sliderItem).removeClass(options.imageActive);
							jQuery(options.sliderItem).eq(bulletRange).addClass(options.imageActive);
							switch (argSliderEffect) {
								case "fade":
									jQuery(options.sliderItem).fadeOut(options.effectTime);
									jQuery(options.sliderItem).eq(bulletRange).fadeIn(options.effectTime);
									if (options.definition == true) {
										var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
										definitionEffect.fadeIn(options.definitionEffectTime);
										if (options.autoStart == true && options.sliderEffect == "fade") {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										} else {
											if (options.sliderEffect == "fade" && options.autoStart == false) {
												var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
												jQuery(el).find("." + options.definitionClass).text(definitionText)
											}
										}
									}
									break;
								case "slide":
									var slideBulletRange = (bulletRange);
									jQuery(argSliderContainer).stop(true, true).animate({
										left: "-" + ((slideBulletRange) * imageWidth)
									}, options.effectTime);
									if (options.definition == true) {
										var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
										definitionEffect.fadeIn(options.definitionEffectTime);
										if (options.autoStart == true && options.sliderEffect == "slide") {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										} else {
											if (options.sliderEffect == "slide" && options.autoStart == false) {
												var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
												jQuery(el).find("." + options.definitionClass).text(definitionText)
											}
										}
									}
									break;
								default:
									jQuery(options.sliderItem).fadeOut(options.effectTime);
									jQuery(options.sliderItem).eq(bulletRange).fadeIn(options.effectTime);
									if (options.definition == true) {
										var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
										definitionEffect.fadeIn(options.definitionEffectTime);
										if (options.autoStart == true && options.sliderEffect == "fade") {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										} else {
											if (options.sliderEffect == "fade" && options.autoStart == false) {
												var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
												jQuery(el).find("." + options.definitionClass).text(definitionText)
											}
										}
									}
							}
							jQuery(el).find("." + options.bulletClass + " a").css({
								"background": "" + options.bulletPassiveColor + "",
								"color": "" + options.bulletPassiveFontColor + ""
							});
							jQuery(el).find("." + options.bulletClass + " a." + options.bulletActiveClass + "").css({
								"background": "" + options.bulletActiveColor + "",
								"color": "" + options.bulletActiveFontColor + ""
							})
						})
					}
					jQuery(el).find("." + options.bulletClass + " a").css({
						"background": "" + options.bulletPassiveColor + "",
						"color": "" + options.bulletPassiveFontColor + ""
					});
					jQuery(el).find("." + options.bulletClass + " a." + options.bulletActiveClass + "").css({
						"background": "" + options.bulletActiveColor + "",
						"color": "" + options.bulletActiveFontColor + ""
					});
					if (options.definition == true) {
						definitionPosition = function (vertical, horizontal) {
							var definitionHtml = jQuery('<div style="background:' + options.definitionBackgroundColor + "; " + vertical + ":" + options.definitionVerticalSpace + "px; " + horizontal + ":" + options.definitionHorizontalSpace + "px; font-family:" + options.definitionFontFamily[options.definitionFontFamilySelect] + "; font-size:" + options.definitionFontFamilySize + "px; color:" + options.definitionFontColor[options.definitionFontColorSelect] + '; padding:5px;" class="' + options.definitionClass + '"></div>');
							jQuery(options.sliderWrapper).append(definitionHtml);
							var definitionEffect = jQuery(".definition").hide();
							definitionEffect.fadeIn(options.definitionEffectTime);
							var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
							jQuery(el).find("." + options.definitionClass).text(definitionText)
						};
						if (options.definition == true && options.definitionVerticalPosition == "top" && options.definitionHorizontalPosition == "right") {
							var definitionRightPosition = "right";
							var definitionTopPosition = "top";
							definitionPosition(definitionTopPosition, definitionRightPosition)
						} else {
							if (options.definition == true && options.definitionVerticalPosition == "top" && options.definitionHorizontalPosition == "left") {
								var definitionRightPosition = "left";
								var definitionTopPosition = "top";
								definitionPosition(definitionTopPosition, definitionRightPosition)
							} else {
								if (options.definition == true && options.definitionVerticalPosition == "bottom" && options.definitionHorizontalPosition == "right") {
									var definitionRightPosition = "right";
									var definitionBottomPosition = "bottom";
									definitionPosition(definitionBottomPosition, definitionRightPosition)
								} else {
									if (options.definition == true && options.definitionVerticalPosition == "bottom" && options.definitionHorizontalPosition == "left") {
										var definitionRightPosition = "left";
										var definitionBottomPosition = "bottom";
										definitionPosition(definitionBottomPosition, definitionRightPosition)
									}
								}
							}
						}
					}
				};
				slideProperties(argSliderContainer, argSliderItem);
				slideEffect = function (argSliderContainer, argSliderItem, argSliderEffect) {
					switch (argSliderEffect) {
						case "fade":
							if (options.showButton == true) {
								jQuery(el).find("." + options.next).click(function () {
									imageRange = jQuery(el).find("." + options.imageActive).index();
									jQuery(argSliderItem).eq(imageRange).removeClass(options.imageActive);
									jQuery(argSliderItem).eq(imageRange + 1).addClass(options.imageActive);
									jQuery(argSliderItem).eq(imageRange).fadeOut(500);
									jQuery(argSliderItem).eq(imageRange + 1).stop(true).fadeIn(500);
									if ((totalImage - 1) == imageRange) {
										jQuery(argSliderItem).removeClass(options.imageActive);
										jQuery(argSliderItem).eq(0).addClass(options.imageActive);
										jQuery(argSliderItem).eq(0).fadeIn(500)
									}
									bulletRange = jQuery(el).find("." + options.bulletActiveClass).index();
									jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActive);
									jQuery(el).find("." + options.bulletClass + " a").eq(bulletRange + 1).addClass(options.bulletActiveClass);
									if ((totalImage - 1) == bulletRange) {
										jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActive);
										jQuery(el).find("." + options.bulletClass + " a").eq(0).addClass(options.bulletActiveClass)
									}
									jQuery(el).find("." + options.bulletClass + " a").css({
										"background": "" + options.bulletPassiveColor + "",
										"color": "" + options.bulletPassiveFontColor + ""
									});
									jQuery(el).find("." + options.bulletClass + " a." + options.bulletActiveClass + "").css({
										"background": "" + options.bulletActiveColor + "",
										"color": "" + options.bulletActiveFontColor + ""
									});
									if (options.definition == true) {
										var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
										definitionEffect.fadeIn(options.definitionEffectTime);
										if (options.autoStart == true && options.sliderEffect == "fade") {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										} else {
											if (options.sliderEffect == "fade" && options.autoStart == false) {
												var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
												jQuery(el).find("." + options.definitionClass).text(definitionText)
											}
										}
									}
								});
								jQuery(el).find("." + options.previous).click(function () {
									imageRange = jQuery(el).find("." + options.imageActive).index();
									jQuery(argSliderItem).eq(imageRange - 1).addClass(options.imageActive);
									jQuery(argSliderItem).eq(imageRange).removeClass(options.imageActive);
									jQuery(argSliderItem).eq(imageRange).fadeOut(500);
									jQuery(argSliderItem).eq(imageRange - 1).stop(true).fadeIn(500);
									bulletRange = jQuery(el).find("." + options.bulletActiveClass).index();
									jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActive);
									jQuery(el).find("." + options.bulletClass + " a").eq(bulletRange - 1).addClass(options.bulletActiveClass);
									jQuery(el).find("." + options.bulletClass + " a").css({
										"background": "" + options.bulletPassiveColor + "",
										"color": "" + options.bulletPassiveFontColor + ""
									});
									jQuery(el).find("." + options.bulletClass + " a." + options.bulletActiveClass + "").css({
										"background": "" + options.bulletActiveColor + "",
										"color": "" + options.bulletActiveFontColor + ""
									});
									if (options.definition == true) {
										var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
										definitionEffect.fadeIn(options.definitionEffectTime);
										if (options.autoStart == true && options.sliderEffect == "fade") {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										} else {
											if (options.sliderEffect == "fade" && options.autoStart == false) {
												var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
												jQuery(el).find("." + options.definitionClass).text(definitionText)
											}
										}
									}
								})
							}
							break;
						case "slide":
							if (options.showButton == true) {
								jQuery(el).find("." + options.next).click(function () {
									imageRange = jQuery(el).find("." + options.imageActive).index();
									jQuery(argSliderItem).removeClass(options.imageActive);
									jQuery(argSliderItem).eq(imageRange + 1).addClass(options.imageActive);
									if ((totalImage - 1) == imageRange) {
										jQuery(argSliderItem).removeClass(options.imageActive);
										jQuery(argSliderItem).eq(0).addClass(options.imageActive);
										jQuery(argSliderContainer).stop(true, true).animate({
											left: "0"
										}, options.effectTime)
									} else {
										jQuery(argSliderContainer).stop(true, true).animate({
											left: "-=" + imageWidth
										}, options.effectTime)
									}
									bulletRange = jQuery(el).find("." + options.bulletActiveClass).index();
									jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActive);
									jQuery(el).find("." + options.bulletClass + " a").eq(bulletRange + 1).addClass(options.bulletActiveClass);
									if ((totalImage - 1) == bulletRange) {
										jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActive);
										jQuery(el).find("." + options.bulletClass + " a").eq(0).addClass(options.bulletActiveClass)
									}
									jQuery(el).find("." + options.bulletClass + " a").css({
										"background": "" + options.bulletPassiveColor + "",
										"color": "" + options.bulletPassiveFontColor + ""
									});
									jQuery(el).find("." + options.bulletClass + " a." + options.bulletActiveClass + "").css({
										"background": "" + options.bulletActiveColor + "",
										"color": "" + options.bulletActiveFontColor + ""
									});
									if (options.definition == true) {
										var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
										definitionEffect.fadeIn(options.definitionEffectTime);
										if (options.autoStart == true && options.sliderEffect == "slide") {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										} else {
											if (options.sliderEffect == "slide" && options.autoStart == false) {
												var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
												jQuery(el).find("." + options.definitionClass).text(definitionText)
											}
										}
									}
								});
								jQuery(el).find("." + options.previous).click(function () {
									imageRange = jQuery(el).find("." + options.imageActive).index();
									if (imageRange == 0) {
										jQuery(argSliderItem).eq(imageRange - 1).addClass(options.imageActive);
										jQuery(argSliderItem).eq(imageRange).removeClass(options.imageActive);
										jQuery(argSliderContainer).stop(true, true).animate({
											left: "-" + (totalImageWidth - imageWidth)
										}, options.effectTime)
									} else {
										jQuery(argSliderItem).eq(imageRange - 1).addClass(options.imageActive);
										jQuery(argSliderItem).eq(imageRange).removeClass(options.imageActive);
										jQuery(argSliderContainer).stop(true, true).animate({
											left: "+=" + imageWidth
										}, options.effectTime)
									}
									bulletRange = jQuery(el).find("." + options.bulletActiveClass).index();
									jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActive);
									jQuery(el).find("." + options.bulletClass + " a").eq(bulletRange - 1).addClass(options.bulletActiveClass);
									jQuery(el).find("." + options.bulletClass + " a").css({
										"background": "" + options.bulletPassiveColor + "",
										"color": "" + options.bulletPassiveFontColor + ""
									});
									jQuery(el).find("." + options.bulletClass + " a." + options.bulletActiveClass + "").css({
										"background": "" + options.bulletActiveColor + "",
										"color": "" + options.bulletActiveFontColor + ""
									});
									if (options.definition == true) {
										var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
										definitionEffect.fadeIn(options.definitionEffectTime);
										if (options.autoStart == true && options.sliderEffect == "slide") {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										} else {
											if (options.sliderEffect == "slide" && options.autoStart == false) {
												var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
												jQuery(el).find("." + options.definitionClass).text(definitionText)
											}
										}
									}
								})
							}
							break;
						default:
							if (options.showButton == true) {
								jQuery(el).find("." + options.next).click(function () {
									imageRange = jQuery(el).find("." + options.imageActive).index();
									jQuery(argSliderItem).eq(imageRange).removeClass(options.imageActive);
									jQuery(argSliderItem).eq(imageRange + 1).addClass(options.imageActive);
									jQuery(argSliderItem).eq(imageRange).fadeOut(500);
									jQuery(argSliderItem).eq(imageRange + 1).stop(true).fadeIn(500);
									if ((totalImage - 1) == imageRange) {
										jQuery(argSliderItem).removeClass(options.imageActive);
										jQuery(argSliderItem).eq(0).addClass(options.imageActive);
										jQuery(argSliderItem).eq(0).fadeIn(500)
									}
									bulletRange = jQuery(el).find("." + options.bulletActiveClass).index();
									jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActive);
									jQuery(el).find("." + options.bulletClass + " a").eq(bulletRange + 1).addClass(options.bulletActiveClass);
									if ((totalImage - 1) == bulletRange) {
										jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActive);
										jQuery(el).find("." + options.bulletClass + " a").eq(0).addClass(options.bulletActiveClass)
									}
									jQuery(el).find("." + options.bulletClass + " a").css({
										"background": "" + options.bulletPassiveColor + "",
										"color": "" + options.bulletPassiveFontColor + ""
									});
									jQuery(el).find("." + options.bulletClass + " a." + options.bulletActiveClass + "").css({
										"background": "" + options.bulletActiveColor + "",
										"color": "" + options.bulletActiveFontColor + ""
									});
									if (options.definition == true) {
										var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
										definitionEffect.fadeIn(options.definitionEffectTime);
										if (options.autoStart == true && options.sliderEffect == "fade") {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										} else {
											if (options.sliderEffect == "fade" && options.autoStart == false) {
												var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
												jQuery(el).find("." + options.definitionClass).text(definitionText)
											}
										}
									}
								});
								jQuery(el).find("." + options.previous).click(function () {
									imageRange = jQuery(el).find("." + options.imageActive).index();
									jQuery(argSliderItem).eq(imageRange - 1).addClass(options.imageActive);
									jQuery(argSliderItem).eq(imageRange).removeClass(options.imageActive);
									jQuery(argSliderItem).eq(imageRange).fadeOut(500);
									jQuery(argSliderItem).eq(imageRange - 1).stop(true).fadeIn(500);
									bulletRange = jQuery(el).find("." + options.bulletActiveClass).index();
									jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActive);
									jQuery(el).find("." + options.bulletClass + " a").eq(bulletRange - 1).addClass(options.bulletActiveClass);
									jQuery(el).find("." + options.bulletClass + " a").css({
										"background": "" + options.bulletPassiveColor + "",
										"color": "" + options.bulletPassiveFontColor + ""
									});
									jQuery(el).find("." + options.bulletClass + " a." + options.bulletActiveClass + "").css({
										"background": "" + options.bulletActiveColor + "",
										"color": "" + options.bulletActiveFontColor + ""
									});
									if (options.definition == true) {
										if (options.autoStart == true && options.sliderEffect == "fade") {
											var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
											definitionEffect.fadeIn(options.definitionEffectTime);
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										} else {
											if (options.sliderEffect == "fade" && options.autoStart == false) {
												var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
												jQuery(el).find("." + options.definitionClass).text(definitionText)
											}
										}
									}
								})
							}
					}
				};
				slideEffect(argSliderContainer, argSliderItem, argSliderEffect);
				var IntervalID = window.setTimeout(autoStart, options.autoStartTime);
				jQuery(el).bind("mouseover", function () {
					window.clearTimeout(IntervalID)
				});
				jQuery(el).bind("mouseout", function () {
					if (IntervalID != null) {
						window.clearTimeout(IntervalID)
					}
					IntervalID = setTimeout(autoStart, options.autoStartTime)
				});

				function autoStart() {
					if (options.autoStart == true) {
						counter = jQuery(el).find("." + options.imageActive).index();
						counter++;
						if (counter == jQuery(argSliderItem).length) {
							counter = 0
						}
						jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActiveClass);
						jQuery(el).find("." + options.bulletClass + " a").eq(counter).addClass(options.bulletActiveClass);
						jQuery(argSliderItem).removeClass(options.imageActive);
						jQuery(argSliderItem).eq(counter).addClass(options.imageActive);
						switch (argSliderEffect) {
							case "fade":
								jQuery(options.sliderItem).fadeOut(options.effectTime);
								jQuery(options.sliderItem).eq(counter).fadeIn(options.effectTime);
								if (options.definition == true) {
									var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
									definitionEffect.fadeIn(options.definitionEffectTime);
									if (options.autoStart == true && options.sliderEffect == "fade") {
										var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
										jQuery(el).find("." + options.definitionClass).text(definitionText)
									} else {
										if (options.sliderEffect == "fade" && options.autoStart == false) {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										}
									}
								}
								break;
							case "slide":
								var slideBulletRange = (counter);
								jQuery(argSliderContainer).stop(true, true).animate({
									left: "-" + ((slideBulletRange) * imageWidth)
								}, options.effectTime);
								if (options.definition == true) {
									var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
									definitionEffect.fadeIn(options.definitionEffectTime);
									if (options.autoStart == true && options.sliderEffect == "slide") {
										var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
										jQuery(el).find("." + options.definitionClass).text(definitionText)
									} else {
										if (options.sliderEffect == "slide" && options.autoStart == false) {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										}
									}
								}
								break;
							default:
								jQuery(options.sliderItem).fadeOut(options.effectTime);
								jQuery(options.sliderItem).eq(counter).fadeIn(options.effectTime);
								if (options.definition == true) {
									var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
									definitionEffect.fadeIn(options.definitionEffectTime);
									if (options.autoStart == true && options.sliderEffect == "fade") {
										var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
										jQuery(el).find("." + options.definitionClass).text(definitionText)
									} else {
										if (options.sliderEffect == "fade" && options.autoStart == false) {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										}
									}
								}
						}
						jQuery(el).find("." + options.bulletClass + " a").css({
							"background": "" + options.bulletPassiveColor + "",
							"color": "" + options.bulletPassiveFontColor + ""
						});
						jQuery(el).find("." + options.bulletClass + " a." + options.bulletActiveClass + "").css({
							"background": "" + options.bulletActiveColor + "",
							"color": "" + options.bulletActiveFontColor + ""
						});
						IntervalID = setTimeout(autoStart, options.autoStartTime)
					}
				}
			};
			createSlide(options.sliderItemContainer, options.sliderItem, options.sliderEffect)
		})
	}
})();
jQuery(document).ready(function () {
	jQuery.fn.filestyle = function (options) {
		var settings = {
			width: 250
		};
		if (options) {
			jQuery.extend(settings, options)
		}
		return this.each(function () {
			var el = this;
			var wrapper = jQuery("<div>").css({
				"width": settings.imagewidth + "px",
				"height": settings.imageheight + "px",
				"background": "url(" + settings.image + ") 0 0 no-repeat",
				"background-position": "right",
				"float": "left",
				"position": "relative",
				"overflow": "hidden"
			});
			var filename = jQuery('<input class="chooseFile" readonly="readonly">').addClass(jQuery(el).attr("class")).css({
				"float": "left",
				"width": settings.width + "px"
			});
			jQuery(el).before(filename);
			jQuery(el).wrap(wrapper);
			jQuery(el).css({
				"position": "relative",
				"height": settings.imageheight + "px",
				"width": settings.width + "px",
				"float": "left",
				"cursor": "pointer",
				"opacity": "0.0"
			});
			if (jQuery.browser.mozilla) {
				if (/Win/.test(navigator.platform)) {
					jQuery(el).css("margin-left", "-142px")
				} else {
					jQuery(el).css("margin-left", "-168px")
				}
			} else {
				jQuery(el).css("margin-left", settings.imagewidth - settings.width + "px")
			}
			jQuery(el).bind("change", function () {
				filename.val(jQuery(el).val())
			})
		})
	};
	ChangeCheckBoxStyle();
	ChangeRadioBoxStyle()
});

function ChangeCheckBoxStyle() {
	var checkboxSelect = 'input[type="checkbox"]';
	jQuery(checkboxSelect).not(jQuery("input[rel=noSkin]")).each(function () {
		if (jQuery(this).attr("class") == "onOff") {
			if (!jQuery(this).parent().hasClass("onOffCheckbox")) {
				jQuery(this).wrap("<div class=\"onOffCheckbox\" onclick='setSwitcherValue(this)'></div>")
			}
		} else {
			if (!jQuery(this).parent().hasClass("checkbox")) {
				jQuery(this).wrap('<div class="checkbox"></div>')
			}
		}
	});
	jQuery("div.checkbox, div.onOffCheckbox").not(jQuery("input[rel=noSkin]")).each(function () {
		if (jQuery(this).find(checkboxSelect).attr("checked") == "checked") {
			jQuery(this).find(checkboxSelect).parent().addClass("checked")
		}
	});
	jQuery("div.checkbox, div.onOffCheckbox").not(jQuery("input[rel=noSkin]")).each(function () {
		jQuery(this).unbind("click");
		jQuery(this).click(function () {
			if (jQuery(this).find(checkboxSelect).attr("checked") == "checked") {
				jQuery(this).find(checkboxSelect).removeAttr("checked");
				jQuery(this).removeClass("checked")
			} else {
				jQuery(this).find(checkboxSelect).attr("checked", "checked");
				jQuery(this).addClass("checked")
			}
			if (jQuery(this).children().attr("onclick")) {
				eval(jQuery(this).children().attr("onclick"))
			}
			if (jQuery(this).children().attr("onchange")) {
				eval(jQuery(this).children().attr("onchange"))
			}
		})
	})
}

function ChangeRadioBoxStyle() {
	var radioSelect = 'input[type="radio"]';
	jQuery(radioSelect).not(jQuery("input[rel=noSkin]")).not(jQuery(".radio > input[type='radio']")).each(function () {
		if (!jQuery(this).parent().hasClass("radio")) {
			jQuery(this).wrap('<div class="radio"></div>')
		}
	});
	jQuery("div.radio").not(jQuery("input[rel=noSkin]")).each(function () {
		if (jQuery(this).find(radioSelect).attr("checked") == "checked") {
			jQuery(this).find(radioSelect).parent().addClass("checked")
		}
	});
	jQuery("div.radio").not(jQuery("input[rel=noSkin]")).each(function () {
		jQuery(this).unbind("click");
		jQuery(this).click(function () {
			if (jQuery(this).find(radioSelect).attr("checked") == "checked") {
				jQuery(this).find(radioSelect).attr("checked", true);
				jQuery(this).find(radioSelect).prop("checked", true);
				jQuery(this).parent().find(".radio.checked").removeClass("checked");
				jQuery(this).addClass("checked")
			} else {
				jQuery(this).parent().find(radioSelect).attr("checked", false);
				jQuery(this).parent().find(radioSelect).removeAttr("checked");
				jQuery(this).parent().find(radioSelect).prop("checked", false);
				jQuery(this).find(radioSelect).attr("checked", true);
				jQuery(this).find(radioSelect).prop("checked", true);
				jQuery(this).parent().find(".radio.checked").removeClass("checked");
				jQuery(this).addClass("checked")
			}
			if (jQuery(this).children().attr("onclick")) {
				eval(jQuery(this).children().attr("onclick"))
			}
			if (jQuery(this).children().attr("onchange")) {
				eval(jQuery(this).children().attr("onchange"))
			}
		})
	})
}(function () {
	jQuery.fn.SmartSlider = function (options) {
		var options = jQuery.extend({
			sliderWidth: 1200,
			sliderHeight: 300,
			autoStart: true,
			autoStartTime: 4000,
			effectTime: 1000,
			definitionEffectTime: 200,
			sliderEffect: "slide",
			showButton: false,
			pagination: false,
			paginationNumeric: true,
			definition: true,
			definitionVerticalPosition: "top",
			definitionHorizontalPosition: "right",
			definitionVerticalSpace: "20",
			definitionHorizontalSpace: "20",
			definitionFontFamily: {
				"arial": "Arial, Helvetica, sans-serif",
				"tahoma": "Tahoma, Geneva, sans-serif",
				"verdana": "Verdana, Geneva, sans-serif",
				"georgia": "Georgia, serif",
				"trebuchet": "'Trebuchet MS', Helvetica, sans-serif",
				"courier": "Courier, monospace",
				"timesnewroman": "'Times New Roman', Times, serif"
			},
			definitionFontFamilySelect: "courier",
			definitionFontColor: {
				"red": "#ff0000",
				"cyan": "#00ffff",
				"blue": "#0000ff",
				"purple": "#FF34B3",
				"yellow": "#ffff00",
				"white": "#ffffff",
				"silver": "#E6E8FA",
				"black": "#000000",
				"orange": "#ffa500",
				"brown": "#8B4513",
				"green": "#008000"
			},
			definitionFontColorSelect: "white",
			definitionFontFamilySize: 18,
			definitionBackgroundColor: "#9c9c9c",
			previousNextSize: "20",
			previousNextColor: "#9c9c9c",
			previousNextOpacity: "70",
			bulletActiveColor: "#464646",
			bulletPassiveColor: "#7f7f7f",
			bulletActiveFontColor: "#ffffff",
			bulletPassiveFontColor: "#999999",
			bulletClass: "_bullet",
			bulletActiveClass: "_bulletActive",
			sliderWrapper: this,
			sliderItemContainer: this.find("._sliderItemContainer"),
			sliderItem: this.find("._sliderItem"),
			imageActive: "_imageActive",
			definitionClass: "_definition",
			next: "_next",
			previous: "_previous"
		}, options);
		return jQuery(this).each(function () {
			var el = this;
			var totalImage = jQuery(options.sliderItem).length;
			var imageWidth = options.sliderWidth;
			var imageHeight = options.sliderHeight;
			var totalImageWidth = (imageWidth * totalImage);
			createSlide = function (argSliderContainer, argSliderItem, argSliderEffect) {
				slideProperties = function (argSliderContainer, argSliderItem) {
					var ImageDataNumber = 1;
					jQuery(argSliderItem).each(function () {
						jQuery(this).attr("id", "_imageData-" + ImageDataNumber);
						ImageDataNumber++
					});
					if (options.showButton == true) {
						var previous = jQuery('<div class="' + options.previous + '" style="margin-top:-' + options.previousNextSize + "px;border-right-color:" + options.previousNextColor + ";border-top-width:" + options.previousNextSize + "px;border-bottom-width:" + options.previousNextSize + "px;border-right-width:" + options.previousNextSize + "px;opacity:" + options.previousNextOpacity / 100 + ";filter:alpha(opacity=" + options.previousNextOpacity + ');"></div>');
						var next = jQuery('<div class="' + options.next + '" style="margin-top:-' + options.previousNextSize + "px;border-left-color:" + options.previousNextColor + ";border-top-width:" + options.previousNextSize + "px;border-bottom-width:" + options.previousNextSize + "px;border-left-width:" + options.previousNextSize + "px;opacity:" + options.previousNextOpacity / 100 + ";filter:alpha(opacity=" + options.previousNextOpacity + ');"></div>');
						jQuery(options.sliderWrapper).append(next).append(previous)
					}
					jQuery(argSliderItem).eq(0).addClass(options.imageActive);
					if (options.sliderEffect == "fade") {
						jQuery(el).css({
							"position": "relative",
							"overflow": "hidden",
							"width": imageWidth + "px ",
							"height": imageHeight + "px"
						});
						jQuery(argSliderContainer).css({
							"position": "absolute",
							"top": "0px",
							"left": "0px"
						});
						jQuery(argSliderItem).css({
							"position": "absolute",
							"left": "0px",
							"top": "0px",
							"width": imageWidth + "px ",
							"height": imageHeight + "px",
							"display": "none"
						});
						jQuery(argSliderItem).eq(0).fadeIn(options.effectTime)
					} else {
						if (options.sliderEffect == "slide") {
							jQuery(el).css({
								"position": "relative",
								"overflow": "hidden",
								"width": imageWidth + "px ",
								"height": imageHeight + "px"
							});
							jQuery(argSliderContainer).css({
								"position": "absolute",
								"width": totalImageWidth + "px ",
								"height": imageHeight + "px",
								"top": "0px",
								"left": "0px"
							});
							jQuery(argSliderItem).css({
								"float": "left",
								"width": imageWidth + "px ",
								"height": imageHeight + "px"
							})
						} else {
							if (options.sliderEffect == "") {
								jQuery(el).css({
									"position": "relative",
									"overflow": "hidden",
									"width": imageWidth + "px ",
									"height": imageHeight + "px"
								});
								jQuery(argSliderContainer).css({
									"position": "absolute",
									"top": "0px",
									"left": "0px"
								});
								jQuery(argSliderItem).css({
									"position": "absolute",
									"left": "0px",
									"top": "0px",
									"width": imageWidth + "px ",
									"height": imageHeight + "px",
									"display": "none"
								});
								jQuery(argSliderItem).eq(0).fadeIn(options.effectTime)
							}
						}
					}
					if (options.pagination == true) {
						var paginationHtml = "",
							i;
						if (options.paginationNumeric == true) {
							jQuery(options.sliderWrapper).append('<div class="' + options.bulletClass + '"></div>');
							for (i = 1; i < (totalImage + 1); i++) {
								paginationHtml = paginationHtml + '<a href="javascript:void(0)">' + i + "</a>"
							}
							jQuery(el).find("." + options.bulletClass).append(paginationHtml)
						} else {
							jQuery(options.sliderWrapper).append('<div class="' + options.bulletClass + '"></div>');
							for (i = 0; i < totalImage; i++) {
								paginationHtml = paginationHtml + '<a href="javascript:void(0)"></a>'
							}
							jQuery(el).find("." + options.bulletClass).append(paginationHtml)
						}
					}
					if (options.pagination == true) {
						jQuery(el).find("." + options.bulletClass + " a").eq(0).addClass(options.bulletActiveClass);
						jQuery(el).find("." + options.bulletClass + " a").click(function () {
							bulletRange = jQuery(this).index();
							jQuery("." + options.bulletClass + " a").removeClass(options.bulletActiveClass);
							jQuery(this).addClass(options.bulletActiveClass);
							jQuery(options.sliderItem).removeClass(options.imageActive);
							jQuery(options.sliderItem).eq(bulletRange).addClass(options.imageActive);
							switch (argSliderEffect) {
								case "fade":
									jQuery(options.sliderItem).fadeOut(options.effectTime);
									jQuery(options.sliderItem).eq(bulletRange).fadeIn(options.effectTime);
									if (options.definition == true) {
										var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
										definitionEffect.fadeIn(options.definitionEffectTime);
										if (options.autoStart == true && options.sliderEffect == "fade") {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										} else {
											if (options.sliderEffect == "fade" && options.autoStart == false) {
												var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
												jQuery(el).find("." + options.definitionClass).text(definitionText)
											}
										}
									}
									break;
								case "slide":
									var slideBulletRange = (bulletRange);
									jQuery(argSliderContainer).stop(true, true).animate({
										left: "-" + ((slideBulletRange) * imageWidth)
									}, options.effectTime);
									if (options.definition == true) {
										var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
										definitionEffect.fadeIn(options.definitionEffectTime);
										if (options.autoStart == true && options.sliderEffect == "slide") {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										} else {
											if (options.sliderEffect == "slide" && options.autoStart == false) {
												var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
												jQuery(el).find("." + options.definitionClass).text(definitionText)
											}
										}
									}
									break;
								default:
									jQuery(options.sliderItem).fadeOut(options.effectTime);
									jQuery(options.sliderItem).eq(bulletRange).fadeIn(options.effectTime);
									if (options.definition == true) {
										var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
										definitionEffect.fadeIn(options.definitionEffectTime);
										if (options.autoStart == true && options.sliderEffect == "fade") {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										} else {
											if (options.sliderEffect == "fade" && options.autoStart == false) {
												var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
												jQuery(el).find("." + options.definitionClass).text(definitionText)
											}
										}
									}
							}
							jQuery(el).find("." + options.bulletClass + " a").css({
								"background": "" + options.bulletPassiveColor + "",
								"color": "" + options.bulletPassiveFontColor + ""
							});
							jQuery(el).find("." + options.bulletClass + " a." + options.bulletActiveClass + "").css({
								"background": "" + options.bulletActiveColor + "",
								"color": "" + options.bulletActiveFontColor + ""
							})
						})
					}
					jQuery(el).find("." + options.bulletClass + " a").css({
						"background": "" + options.bulletPassiveColor + "",
						"color": "" + options.bulletPassiveFontColor + ""
					});
					jQuery(el).find("." + options.bulletClass + " a." + options.bulletActiveClass + "").css({
						"background": "" + options.bulletActiveColor + "",
						"color": "" + options.bulletActiveFontColor + ""
					});
					if (options.definition == true) {
						definitionPosition = function (vertical, horizontal) {
							var definitionHtml = jQuery('<div style="background:' + options.definitionBackgroundColor + "; " + vertical + ":" + options.definitionVerticalSpace + "px; " + horizontal + ":" + options.definitionHorizontalSpace + "px; font-family:" + options.definitionFontFamily[options.definitionFontFamilySelect] + "; font-size:" + options.definitionFontFamilySize + "px; color:" + options.definitionFontColor[options.definitionFontColorSelect] + '; padding:5px;" class="' + options.definitionClass + '"></div>');
							jQuery(options.sliderWrapper).append(definitionHtml);
							var definitionEffect = jQuery(".definition").hide();
							definitionEffect.fadeIn(options.definitionEffectTime);
							var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
							jQuery(el).find("." + options.definitionClass).text(definitionText)
						};
						if (options.definition == true && options.definitionVerticalPosition == "top" && options.definitionHorizontalPosition == "right") {
							var definitionRightPosition = "right";
							var definitionTopPosition = "top";
							definitionPosition(definitionTopPosition, definitionRightPosition)
						} else {
							if (options.definition == true && options.definitionVerticalPosition == "top" && options.definitionHorizontalPosition == "left") {
								var definitionRightPosition = "left";
								var definitionTopPosition = "top";
								definitionPosition(definitionTopPosition, definitionRightPosition)
							} else {
								if (options.definition == true && options.definitionVerticalPosition == "bottom" && options.definitionHorizontalPosition == "right") {
									var definitionRightPosition = "right";
									var definitionBottomPosition = "bottom";
									definitionPosition(definitionBottomPosition, definitionRightPosition)
								} else {
									if (options.definition == true && options.definitionVerticalPosition == "bottom" && options.definitionHorizontalPosition == "left") {
										var definitionRightPosition = "left";
										var definitionBottomPosition = "bottom";
										definitionPosition(definitionBottomPosition, definitionRightPosition)
									}
								}
							}
						}
					}
				};
				slideProperties(argSliderContainer, argSliderItem);
				slideEffect = function (argSliderContainer, argSliderItem, argSliderEffect) {
					switch (argSliderEffect) {
						case "fade":
							if (options.showButton == true) {
								jQuery(el).find("." + options.next).click(function () {
									imageRange = jQuery(el).find("." + options.imageActive).index();
									jQuery(argSliderItem).eq(imageRange).removeClass(options.imageActive);
									jQuery(argSliderItem).eq(imageRange + 1).addClass(options.imageActive);
									jQuery(argSliderItem).eq(imageRange).fadeOut(500);
									jQuery(argSliderItem).eq(imageRange + 1).stop(true).fadeIn(500);
									if ((totalImage - 1) == imageRange) {
										jQuery(argSliderItem).removeClass(options.imageActive);
										jQuery(argSliderItem).eq(0).addClass(options.imageActive);
										jQuery(argSliderItem).eq(0).fadeIn(500)
									}
									bulletRange = jQuery(el).find("." + options.bulletActiveClass).index();
									jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActive);
									jQuery(el).find("." + options.bulletClass + " a").eq(bulletRange + 1).addClass(options.bulletActiveClass);
									if ((totalImage - 1) == bulletRange) {
										jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActive);
										jQuery(el).find("." + options.bulletClass + " a").eq(0).addClass(options.bulletActiveClass)
									}
									jQuery(el).find("." + options.bulletClass + " a").css({
										"background": "" + options.bulletPassiveColor + "",
										"color": "" + options.bulletPassiveFontColor + ""
									});
									jQuery(el).find("." + options.bulletClass + " a." + options.bulletActiveClass + "").css({
										"background": "" + options.bulletActiveColor + "",
										"color": "" + options.bulletActiveFontColor + ""
									});
									if (options.definition == true) {
										var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
										definitionEffect.fadeIn(options.definitionEffectTime);
										if (options.autoStart == true && options.sliderEffect == "fade") {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										} else {
											if (options.sliderEffect == "fade" && options.autoStart == false) {
												var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
												jQuery(el).find("." + options.definitionClass).text(definitionText)
											}
										}
									}
								});
								jQuery(el).find("." + options.previous).click(function () {
									imageRange = jQuery(el).find("." + options.imageActive).index();
									jQuery(argSliderItem).eq(imageRange - 1).addClass(options.imageActive);
									jQuery(argSliderItem).eq(imageRange).removeClass(options.imageActive);
									jQuery(argSliderItem).eq(imageRange).fadeOut(500);
									jQuery(argSliderItem).eq(imageRange - 1).stop(true).fadeIn(500);
									bulletRange = jQuery(el).find("." + options.bulletActiveClass).index();
									jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActive);
									jQuery(el).find("." + options.bulletClass + " a").eq(bulletRange - 1).addClass(options.bulletActiveClass);
									jQuery(el).find("." + options.bulletClass + " a").css({
										"background": "" + options.bulletPassiveColor + "",
										"color": "" + options.bulletPassiveFontColor + ""
									});
									jQuery(el).find("." + options.bulletClass + " a." + options.bulletActiveClass + "").css({
										"background": "" + options.bulletActiveColor + "",
										"color": "" + options.bulletActiveFontColor + ""
									});
									if (options.definition == true) {
										var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
										definitionEffect.fadeIn(options.definitionEffectTime);
										if (options.autoStart == true && options.sliderEffect == "fade") {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										} else {
											if (options.sliderEffect == "fade" && options.autoStart == false) {
												var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
												jQuery(el).find("." + options.definitionClass).text(definitionText)
											}
										}
									}
								})
							}
							break;
						case "slide":
							if (options.showButton == true) {
								jQuery(el).find("." + options.next).click(function () {
									imageRange = jQuery(el).find("." + options.imageActive).index();
									jQuery(argSliderItem).removeClass(options.imageActive);
									jQuery(argSliderItem).eq(imageRange + 1).addClass(options.imageActive);
									if ((totalImage - 1) == imageRange) {
										jQuery(argSliderItem).removeClass(options.imageActive);
										jQuery(argSliderItem).eq(0).addClass(options.imageActive);
										jQuery(argSliderContainer).stop(true, true).animate({
											left: "0"
										}, options.effectTime)
									} else {
										jQuery(argSliderContainer).stop(true, true).animate({
											left: "-=" + imageWidth
										}, options.effectTime)
									}
									bulletRange = jQuery(el).find("." + options.bulletActiveClass).index();
									jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActive);
									jQuery(el).find("." + options.bulletClass + " a").eq(bulletRange + 1).addClass(options.bulletActiveClass);
									if ((totalImage - 1) == bulletRange) {
										jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActive);
										jQuery(el).find("." + options.bulletClass + " a").eq(0).addClass(options.bulletActiveClass)
									}
									jQuery(el).find("." + options.bulletClass + " a").css({
										"background": "" + options.bulletPassiveColor + "",
										"color": "" + options.bulletPassiveFontColor + ""
									});
									jQuery(el).find("." + options.bulletClass + " a." + options.bulletActiveClass + "").css({
										"background": "" + options.bulletActiveColor + "",
										"color": "" + options.bulletActiveFontColor + ""
									});
									if (options.definition == true) {
										var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
										definitionEffect.fadeIn(options.definitionEffectTime);
										if (options.autoStart == true && options.sliderEffect == "slide") {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										} else {
											if (options.sliderEffect == "slide" && options.autoStart == false) {
												var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
												jQuery(el).find("." + options.definitionClass).text(definitionText)
											}
										}
									}
								});
								jQuery(el).find("." + options.previous).click(function () {
									imageRange = jQuery(el).find("." + options.imageActive).index();
									if (imageRange == 0) {
										jQuery(argSliderItem).eq(imageRange - 1).addClass(options.imageActive);
										jQuery(argSliderItem).eq(imageRange).removeClass(options.imageActive);
										jQuery(argSliderContainer).stop(true, true).animate({
											left: "-" + (totalImageWidth - imageWidth)
										}, options.effectTime)
									} else {
										jQuery(argSliderItem).eq(imageRange - 1).addClass(options.imageActive);
										jQuery(argSliderItem).eq(imageRange).removeClass(options.imageActive);
										jQuery(argSliderContainer).stop(true, true).animate({
											left: "+=" + imageWidth
										}, options.effectTime)
									}
									bulletRange = jQuery(el).find("." + options.bulletActiveClass).index();
									jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActive);
									jQuery(el).find("." + options.bulletClass + " a").eq(bulletRange - 1).addClass(options.bulletActiveClass);
									jQuery(el).find("." + options.bulletClass + " a").css({
										"background": "" + options.bulletPassiveColor + "",
										"color": "" + options.bulletPassiveFontColor + ""
									});
									jQuery(el).find("." + options.bulletClass + " a." + options.bulletActiveClass + "").css({
										"background": "" + options.bulletActiveColor + "",
										"color": "" + options.bulletActiveFontColor + ""
									});
									if (options.definition == true) {
										var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
										definitionEffect.fadeIn(options.definitionEffectTime);
										if (options.autoStart == true && options.sliderEffect == "slide") {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										} else {
											if (options.sliderEffect == "slide" && options.autoStart == false) {
												var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
												jQuery(el).find("." + options.definitionClass).text(definitionText)
											}
										}
									}
								})
							}
							break;
						default:
							if (options.showButton == true) {
								jQuery(el).find("." + options.next).click(function () {
									imageRange = jQuery(el).find("." + options.imageActive).index();
									jQuery(argSliderItem).eq(imageRange).removeClass(options.imageActive);
									jQuery(argSliderItem).eq(imageRange + 1).addClass(options.imageActive);
									jQuery(argSliderItem).eq(imageRange).fadeOut(500);
									jQuery(argSliderItem).eq(imageRange + 1).stop(true).fadeIn(500);
									if ((totalImage - 1) == imageRange) {
										jQuery(argSliderItem).removeClass(options.imageActive);
										jQuery(argSliderItem).eq(0).addClass(options.imageActive);
										jQuery(argSliderItem).eq(0).fadeIn(500)
									}
									bulletRange = jQuery(el).find("." + options.bulletActiveClass).index();
									jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActive);
									jQuery(el).find("." + options.bulletClass + " a").eq(bulletRange + 1).addClass(options.bulletActiveClass);
									if ((totalImage - 1) == bulletRange) {
										jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActive);
										jQuery(el).find("." + options.bulletClass + " a").eq(0).addClass(options.bulletActiveClass)
									}
									jQuery(el).find("." + options.bulletClass + " a").css({
										"background": "" + options.bulletPassiveColor + "",
										"color": "" + options.bulletPassiveFontColor + ""
									});
									jQuery(el).find("." + options.bulletClass + " a." + options.bulletActiveClass + "").css({
										"background": "" + options.bulletActiveColor + "",
										"color": "" + options.bulletActiveFontColor + ""
									});
									if (options.definition == true) {
										var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
										definitionEffect.fadeIn(options.definitionEffectTime);
										if (options.autoStart == true && options.sliderEffect == "fade") {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										} else {
											if (options.sliderEffect == "fade" && options.autoStart == false) {
												var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
												jQuery(el).find("." + options.definitionClass).text(definitionText)
											}
										}
									}
								});
								jQuery(el).find("." + options.previous).click(function () {
									imageRange = jQuery(el).find("." + options.imageActive).index();
									jQuery(argSliderItem).eq(imageRange - 1).addClass(options.imageActive);
									jQuery(argSliderItem).eq(imageRange).removeClass(options.imageActive);
									jQuery(argSliderItem).eq(imageRange).fadeOut(500);
									jQuery(argSliderItem).eq(imageRange - 1).stop(true).fadeIn(500);
									bulletRange = jQuery(el).find("." + options.bulletActiveClass).index();
									jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActive);
									jQuery(el).find("." + options.bulletClass + " a").eq(bulletRange - 1).addClass(options.bulletActiveClass);
									jQuery(el).find("." + options.bulletClass + " a").css({
										"background": "" + options.bulletPassiveColor + "",
										"color": "" + options.bulletPassiveFontColor + ""
									});
									jQuery(el).find("." + options.bulletClass + " a." + options.bulletActiveClass + "").css({
										"background": "" + options.bulletActiveColor + "",
										"color": "" + options.bulletActiveFontColor + ""
									});
									if (options.definition == true) {
										if (options.autoStart == true && options.sliderEffect == "fade") {
											var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
											definitionEffect.fadeIn(options.definitionEffectTime);
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										} else {
											if (options.sliderEffect == "fade" && options.autoStart == false) {
												var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
												jQuery(el).find("." + options.definitionClass).text(definitionText)
											}
										}
									}
								})
							}
					}
				};
				slideEffect(argSliderContainer, argSliderItem, argSliderEffect);
				var IntervalID = window.setTimeout(autoStart, options.autoStartTime);
				jQuery(el).bind("mouseover", function () {
					window.clearTimeout(IntervalID)
				});
				jQuery(el).bind("mouseout", function () {
					if (IntervalID != null) {
						window.clearTimeout(IntervalID)
					}
					IntervalID = setTimeout(autoStart, options.autoStartTime)
				});

				function autoStart() {
					if (options.autoStart == true) {
						counter = jQuery(el).find("." + options.imageActive).index();
						counter++;
						if (counter == jQuery(argSliderItem).length) {
							counter = 0
						}
						jQuery(el).find("." + options.bulletClass + " a").removeClass(options.bulletActiveClass);
						jQuery(el).find("." + options.bulletClass + " a").eq(counter).addClass(options.bulletActiveClass);
						jQuery(argSliderItem).removeClass(options.imageActive);
						jQuery(argSliderItem).eq(counter).addClass(options.imageActive);
						switch (argSliderEffect) {
							case "fade":
								jQuery(options.sliderItem).fadeOut(options.effectTime);
								jQuery(options.sliderItem).eq(counter).fadeIn(options.effectTime);
								if (options.definition == true) {
									var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
									definitionEffect.fadeIn(options.definitionEffectTime);
									if (options.autoStart == true && options.sliderEffect == "fade") {
										var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
										jQuery(el).find("." + options.definitionClass).text(definitionText)
									} else {
										if (options.sliderEffect == "fade" && options.autoStart == false) {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										}
									}
								}
								break;
							case "slide":
								var slideBulletRange = (counter);
								jQuery(argSliderContainer).stop(true, true).animate({
									left: "-" + ((slideBulletRange) * imageWidth)
								}, options.effectTime);
								if (options.definition == true) {
									var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
									definitionEffect.fadeIn(options.definitionEffectTime);
									if (options.autoStart == true && options.sliderEffect == "slide") {
										var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
										jQuery(el).find("." + options.definitionClass).text(definitionText)
									} else {
										if (options.sliderEffect == "slide" && options.autoStart == false) {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										}
									}
								}
								break;
							default:
								jQuery(options.sliderItem).fadeOut(options.effectTime);
								jQuery(options.sliderItem).eq(counter).fadeIn(options.effectTime);
								if (options.definition == true) {
									var definitionEffect = jQuery(el).find("." + options.definitionClass).hide();
									definitionEffect.fadeIn(options.definitionEffectTime);
									if (options.autoStart == true && options.sliderEffect == "fade") {
										var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
										jQuery(el).find("." + options.definitionClass).text(definitionText)
									} else {
										if (options.sliderEffect == "fade" && options.autoStart == false) {
											var definitionText = jQuery(el).find("." + options.imageActive + " a").attr("rel");
											jQuery(el).find("." + options.definitionClass).text(definitionText)
										}
									}
								}
						}
						jQuery(el).find("." + options.bulletClass + " a").css({
							"background": "" + options.bulletPassiveColor + "",
							"color": "" + options.bulletPassiveFontColor + ""
						});
						jQuery(el).find("." + options.bulletClass + " a." + options.bulletActiveClass + "").css({
							"background": "" + options.bulletActiveColor + "",
							"color": "" + options.bulletActiveFontColor + ""
						});
						IntervalID = setTimeout(autoStart, options.autoStartTime)
					}
				}
			};
			createSlide(options.sliderItemContainer, options.sliderItem, options.sliderEffect)
		})
	}
})();
var midBlockIds = new Array();

function slideProducts(selectedShowcase, currentOffset) {
	var slideLeftImage = "slideLeftImage";
	var slideRightImage = "slideRightImage";
	var slideLeftLink = "slideLeftLink";
	var slideRightLink = "slideRightLink";
	jQuery("#slideContent").html("");
	jQuery("#slideLoading").show();
	for (var i = 0; i < midBlockIds.length; i++) {
		jQuery("#midBlock" + midBlockIds[i]).attr("class", "")
	}
	jQuery("#midBlock" + selectedShowcase).attr("class", "ui-tabs-selected");
	if (currentOffset < 0) {
		currentOffset = 0
	}
	jQuery.ajax({
		type: "POST",
		url: "/index.php?do=catalog/showTabMidBlock",
		data: "midBlock=" + selectedShowcase + "&offset=" + currentOffset,
		dataType: "json",
		async: false,
		success: function (result) {
			var productCount = result.count;
			var showcaseLimit = result.limit;
			jQuery("#slideLoading").hide();
			jQuery("#slideContent").html(result.template);
			if (showcaseLimit < productCount && currentOffset == 0) {
				document.getElementById(slideLeftImage).setAttribute("src", "/images/tabs/pagerleft.gif");
				document.getElementById(slideRightImage).setAttribute("src", "/images/tabs/pagerrighthover.gif");
				document.getElementById(slideLeftLink).onclick = function () {};
				document.getElementById(slideRightLink).onclick = function () {
					slideProducts(selectedShowcase, currentOffset + 2)
				}
			} else {
				if (currentOffset * showcaseLimit < productCount && currentOffset > 0) {
					document.getElementById(slideLeftImage).setAttribute("src", "/images/tabs/pagerlefthover.gif");
					document.getElementById(slideRightImage).setAttribute("src", "/images/tabs/pagerrighthover.gif");
					document.getElementById(slideLeftLink).onclick = function () {
						if (currentOffset - 1 == 1) {
							currentOffset = 0
						} else {
							currentOffset = currentOffset - 1
						}
						slideProducts(selectedShowcase, currentOffset)
					};
					document.getElementById(slideRightLink).onclick = function () {
						slideProducts(selectedShowcase, currentOffset + 1)
					}
				} else {
					if (productCount <= showcaseLimit) {
						document.getElementById(slideLeftImage).setAttribute("src", "/images/tabs/pagerleft.gif");
						document.getElementById(slideRightImage).setAttribute("src", "/images/tabs/pagerright.gif");
						document.getElementById(slideLeftLink).onclick = function () {};
						document.getElementById(slideRightLink).onclick = function () {}
					} else {
						if (currentOffset * showcaseLimit >= productCount) {
							document.getElementById(slideLeftImage).setAttribute("src", "/images/tabs/pagerlefthover.gif");
							document.getElementById(slideRightImage).setAttribute("src", "/images/tabs/pagerright.gif");
							document.getElementById(slideLeftLink).onclick = function () {
								if (currentOffset - 1 == 1) {
									currentOffset = 0
								} else {
									currentOffset = currentOffset - 1
								}
								slideProducts(selectedShowcase, currentOffset)
							};
							document.getElementById(slideRightLink).onclick = function () {}
						}
					}
				}
			}
			if (jQuery(".lazy").attr("id") != undefined) {
				jQuery("img.lazy").lazyload({
					effect: "fadeIn",
					effectspeed: 500,
					skip_invisible: false
				})
			}
		}
	})
};
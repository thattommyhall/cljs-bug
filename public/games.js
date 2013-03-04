var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__6618 = x == null ? null : x;
  if(p[goog.typeOf(x__6618)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6619__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6619 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6619__delegate.call(this, array, i, idxs)
    };
    G__6619.cljs$lang$maxFixedArity = 2;
    G__6619.cljs$lang$applyTo = function(arglist__6620) {
      var array = cljs.core.first(arglist__6620);
      var i = cljs.core.first(cljs.core.next(arglist__6620));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6620));
      return G__6619__delegate(array, i, idxs)
    };
    G__6619.cljs$lang$arity$variadic = G__6619__delegate;
    return G__6619
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____6705 = this$;
      if(and__3822__auto____6705) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6705
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2418__auto____6706 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6707 = cljs.core._invoke[goog.typeOf(x__2418__auto____6706)];
        if(or__3824__auto____6707) {
          return or__3824__auto____6707
        }else {
          var or__3824__auto____6708 = cljs.core._invoke["_"];
          if(or__3824__auto____6708) {
            return or__3824__auto____6708
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6709 = this$;
      if(and__3822__auto____6709) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6709
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2418__auto____6710 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6711 = cljs.core._invoke[goog.typeOf(x__2418__auto____6710)];
        if(or__3824__auto____6711) {
          return or__3824__auto____6711
        }else {
          var or__3824__auto____6712 = cljs.core._invoke["_"];
          if(or__3824__auto____6712) {
            return or__3824__auto____6712
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6713 = this$;
      if(and__3822__auto____6713) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6713
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2418__auto____6714 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6715 = cljs.core._invoke[goog.typeOf(x__2418__auto____6714)];
        if(or__3824__auto____6715) {
          return or__3824__auto____6715
        }else {
          var or__3824__auto____6716 = cljs.core._invoke["_"];
          if(or__3824__auto____6716) {
            return or__3824__auto____6716
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6717 = this$;
      if(and__3822__auto____6717) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6717
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2418__auto____6718 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6719 = cljs.core._invoke[goog.typeOf(x__2418__auto____6718)];
        if(or__3824__auto____6719) {
          return or__3824__auto____6719
        }else {
          var or__3824__auto____6720 = cljs.core._invoke["_"];
          if(or__3824__auto____6720) {
            return or__3824__auto____6720
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6721 = this$;
      if(and__3822__auto____6721) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6721
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2418__auto____6722 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6723 = cljs.core._invoke[goog.typeOf(x__2418__auto____6722)];
        if(or__3824__auto____6723) {
          return or__3824__auto____6723
        }else {
          var or__3824__auto____6724 = cljs.core._invoke["_"];
          if(or__3824__auto____6724) {
            return or__3824__auto____6724
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6725 = this$;
      if(and__3822__auto____6725) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6725
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2418__auto____6726 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6727 = cljs.core._invoke[goog.typeOf(x__2418__auto____6726)];
        if(or__3824__auto____6727) {
          return or__3824__auto____6727
        }else {
          var or__3824__auto____6728 = cljs.core._invoke["_"];
          if(or__3824__auto____6728) {
            return or__3824__auto____6728
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6729 = this$;
      if(and__3822__auto____6729) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6729
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2418__auto____6730 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6731 = cljs.core._invoke[goog.typeOf(x__2418__auto____6730)];
        if(or__3824__auto____6731) {
          return or__3824__auto____6731
        }else {
          var or__3824__auto____6732 = cljs.core._invoke["_"];
          if(or__3824__auto____6732) {
            return or__3824__auto____6732
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6733 = this$;
      if(and__3822__auto____6733) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6733
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2418__auto____6734 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6735 = cljs.core._invoke[goog.typeOf(x__2418__auto____6734)];
        if(or__3824__auto____6735) {
          return or__3824__auto____6735
        }else {
          var or__3824__auto____6736 = cljs.core._invoke["_"];
          if(or__3824__auto____6736) {
            return or__3824__auto____6736
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6737 = this$;
      if(and__3822__auto____6737) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6737
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2418__auto____6738 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6739 = cljs.core._invoke[goog.typeOf(x__2418__auto____6738)];
        if(or__3824__auto____6739) {
          return or__3824__auto____6739
        }else {
          var or__3824__auto____6740 = cljs.core._invoke["_"];
          if(or__3824__auto____6740) {
            return or__3824__auto____6740
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6741 = this$;
      if(and__3822__auto____6741) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6741
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2418__auto____6742 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6743 = cljs.core._invoke[goog.typeOf(x__2418__auto____6742)];
        if(or__3824__auto____6743) {
          return or__3824__auto____6743
        }else {
          var or__3824__auto____6744 = cljs.core._invoke["_"];
          if(or__3824__auto____6744) {
            return or__3824__auto____6744
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6745 = this$;
      if(and__3822__auto____6745) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6745
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2418__auto____6746 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6747 = cljs.core._invoke[goog.typeOf(x__2418__auto____6746)];
        if(or__3824__auto____6747) {
          return or__3824__auto____6747
        }else {
          var or__3824__auto____6748 = cljs.core._invoke["_"];
          if(or__3824__auto____6748) {
            return or__3824__auto____6748
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6749 = this$;
      if(and__3822__auto____6749) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6749
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2418__auto____6750 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6751 = cljs.core._invoke[goog.typeOf(x__2418__auto____6750)];
        if(or__3824__auto____6751) {
          return or__3824__auto____6751
        }else {
          var or__3824__auto____6752 = cljs.core._invoke["_"];
          if(or__3824__auto____6752) {
            return or__3824__auto____6752
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6753 = this$;
      if(and__3822__auto____6753) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6753
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2418__auto____6754 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6755 = cljs.core._invoke[goog.typeOf(x__2418__auto____6754)];
        if(or__3824__auto____6755) {
          return or__3824__auto____6755
        }else {
          var or__3824__auto____6756 = cljs.core._invoke["_"];
          if(or__3824__auto____6756) {
            return or__3824__auto____6756
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6757 = this$;
      if(and__3822__auto____6757) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6757
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2418__auto____6758 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6759 = cljs.core._invoke[goog.typeOf(x__2418__auto____6758)];
        if(or__3824__auto____6759) {
          return or__3824__auto____6759
        }else {
          var or__3824__auto____6760 = cljs.core._invoke["_"];
          if(or__3824__auto____6760) {
            return or__3824__auto____6760
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6761 = this$;
      if(and__3822__auto____6761) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6761
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2418__auto____6762 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6763 = cljs.core._invoke[goog.typeOf(x__2418__auto____6762)];
        if(or__3824__auto____6763) {
          return or__3824__auto____6763
        }else {
          var or__3824__auto____6764 = cljs.core._invoke["_"];
          if(or__3824__auto____6764) {
            return or__3824__auto____6764
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6765 = this$;
      if(and__3822__auto____6765) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6765
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2418__auto____6766 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6767 = cljs.core._invoke[goog.typeOf(x__2418__auto____6766)];
        if(or__3824__auto____6767) {
          return or__3824__auto____6767
        }else {
          var or__3824__auto____6768 = cljs.core._invoke["_"];
          if(or__3824__auto____6768) {
            return or__3824__auto____6768
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6769 = this$;
      if(and__3822__auto____6769) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6769
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2418__auto____6770 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6771 = cljs.core._invoke[goog.typeOf(x__2418__auto____6770)];
        if(or__3824__auto____6771) {
          return or__3824__auto____6771
        }else {
          var or__3824__auto____6772 = cljs.core._invoke["_"];
          if(or__3824__auto____6772) {
            return or__3824__auto____6772
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6773 = this$;
      if(and__3822__auto____6773) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6773
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2418__auto____6774 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6775 = cljs.core._invoke[goog.typeOf(x__2418__auto____6774)];
        if(or__3824__auto____6775) {
          return or__3824__auto____6775
        }else {
          var or__3824__auto____6776 = cljs.core._invoke["_"];
          if(or__3824__auto____6776) {
            return or__3824__auto____6776
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6777 = this$;
      if(and__3822__auto____6777) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6777
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2418__auto____6778 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6779 = cljs.core._invoke[goog.typeOf(x__2418__auto____6778)];
        if(or__3824__auto____6779) {
          return or__3824__auto____6779
        }else {
          var or__3824__auto____6780 = cljs.core._invoke["_"];
          if(or__3824__auto____6780) {
            return or__3824__auto____6780
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6781 = this$;
      if(and__3822__auto____6781) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6781
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2418__auto____6782 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6783 = cljs.core._invoke[goog.typeOf(x__2418__auto____6782)];
        if(or__3824__auto____6783) {
          return or__3824__auto____6783
        }else {
          var or__3824__auto____6784 = cljs.core._invoke["_"];
          if(or__3824__auto____6784) {
            return or__3824__auto____6784
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6785 = this$;
      if(and__3822__auto____6785) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6785
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2418__auto____6786 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6787 = cljs.core._invoke[goog.typeOf(x__2418__auto____6786)];
        if(or__3824__auto____6787) {
          return or__3824__auto____6787
        }else {
          var or__3824__auto____6788 = cljs.core._invoke["_"];
          if(or__3824__auto____6788) {
            return or__3824__auto____6788
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____6793 = coll;
    if(and__3822__auto____6793) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6793
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2418__auto____6794 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6795 = cljs.core._count[goog.typeOf(x__2418__auto____6794)];
      if(or__3824__auto____6795) {
        return or__3824__auto____6795
      }else {
        var or__3824__auto____6796 = cljs.core._count["_"];
        if(or__3824__auto____6796) {
          return or__3824__auto____6796
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____6801 = coll;
    if(and__3822__auto____6801) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6801
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2418__auto____6802 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6803 = cljs.core._empty[goog.typeOf(x__2418__auto____6802)];
      if(or__3824__auto____6803) {
        return or__3824__auto____6803
      }else {
        var or__3824__auto____6804 = cljs.core._empty["_"];
        if(or__3824__auto____6804) {
          return or__3824__auto____6804
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____6809 = coll;
    if(and__3822__auto____6809) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6809
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2418__auto____6810 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6811 = cljs.core._conj[goog.typeOf(x__2418__auto____6810)];
      if(or__3824__auto____6811) {
        return or__3824__auto____6811
      }else {
        var or__3824__auto____6812 = cljs.core._conj["_"];
        if(or__3824__auto____6812) {
          return or__3824__auto____6812
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____6821 = coll;
      if(and__3822__auto____6821) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6821
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2418__auto____6822 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6823 = cljs.core._nth[goog.typeOf(x__2418__auto____6822)];
        if(or__3824__auto____6823) {
          return or__3824__auto____6823
        }else {
          var or__3824__auto____6824 = cljs.core._nth["_"];
          if(or__3824__auto____6824) {
            return or__3824__auto____6824
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6825 = coll;
      if(and__3822__auto____6825) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6825
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2418__auto____6826 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6827 = cljs.core._nth[goog.typeOf(x__2418__auto____6826)];
        if(or__3824__auto____6827) {
          return or__3824__auto____6827
        }else {
          var or__3824__auto____6828 = cljs.core._nth["_"];
          if(or__3824__auto____6828) {
            return or__3824__auto____6828
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____6833 = coll;
    if(and__3822__auto____6833) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6833
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2418__auto____6834 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6835 = cljs.core._first[goog.typeOf(x__2418__auto____6834)];
      if(or__3824__auto____6835) {
        return or__3824__auto____6835
      }else {
        var or__3824__auto____6836 = cljs.core._first["_"];
        if(or__3824__auto____6836) {
          return or__3824__auto____6836
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6841 = coll;
    if(and__3822__auto____6841) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6841
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2418__auto____6842 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6843 = cljs.core._rest[goog.typeOf(x__2418__auto____6842)];
      if(or__3824__auto____6843) {
        return or__3824__auto____6843
      }else {
        var or__3824__auto____6844 = cljs.core._rest["_"];
        if(or__3824__auto____6844) {
          return or__3824__auto____6844
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____6849 = coll;
    if(and__3822__auto____6849) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6849
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2418__auto____6850 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6851 = cljs.core._next[goog.typeOf(x__2418__auto____6850)];
      if(or__3824__auto____6851) {
        return or__3824__auto____6851
      }else {
        var or__3824__auto____6852 = cljs.core._next["_"];
        if(or__3824__auto____6852) {
          return or__3824__auto____6852
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____6861 = o;
      if(and__3822__auto____6861) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6861
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2418__auto____6862 = o == null ? null : o;
      return function() {
        var or__3824__auto____6863 = cljs.core._lookup[goog.typeOf(x__2418__auto____6862)];
        if(or__3824__auto____6863) {
          return or__3824__auto____6863
        }else {
          var or__3824__auto____6864 = cljs.core._lookup["_"];
          if(or__3824__auto____6864) {
            return or__3824__auto____6864
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6865 = o;
      if(and__3822__auto____6865) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6865
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2418__auto____6866 = o == null ? null : o;
      return function() {
        var or__3824__auto____6867 = cljs.core._lookup[goog.typeOf(x__2418__auto____6866)];
        if(or__3824__auto____6867) {
          return or__3824__auto____6867
        }else {
          var or__3824__auto____6868 = cljs.core._lookup["_"];
          if(or__3824__auto____6868) {
            return or__3824__auto____6868
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____6873 = coll;
    if(and__3822__auto____6873) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6873
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2418__auto____6874 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6875 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2418__auto____6874)];
      if(or__3824__auto____6875) {
        return or__3824__auto____6875
      }else {
        var or__3824__auto____6876 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6876) {
          return or__3824__auto____6876
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6881 = coll;
    if(and__3822__auto____6881) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6881
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2418__auto____6882 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6883 = cljs.core._assoc[goog.typeOf(x__2418__auto____6882)];
      if(or__3824__auto____6883) {
        return or__3824__auto____6883
      }else {
        var or__3824__auto____6884 = cljs.core._assoc["_"];
        if(or__3824__auto____6884) {
          return or__3824__auto____6884
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____6889 = coll;
    if(and__3822__auto____6889) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6889
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2418__auto____6890 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6891 = cljs.core._dissoc[goog.typeOf(x__2418__auto____6890)];
      if(or__3824__auto____6891) {
        return or__3824__auto____6891
      }else {
        var or__3824__auto____6892 = cljs.core._dissoc["_"];
        if(or__3824__auto____6892) {
          return or__3824__auto____6892
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____6897 = coll;
    if(and__3822__auto____6897) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6897
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2418__auto____6898 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6899 = cljs.core._key[goog.typeOf(x__2418__auto____6898)];
      if(or__3824__auto____6899) {
        return or__3824__auto____6899
      }else {
        var or__3824__auto____6900 = cljs.core._key["_"];
        if(or__3824__auto____6900) {
          return or__3824__auto____6900
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6905 = coll;
    if(and__3822__auto____6905) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6905
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2418__auto____6906 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6907 = cljs.core._val[goog.typeOf(x__2418__auto____6906)];
      if(or__3824__auto____6907) {
        return or__3824__auto____6907
      }else {
        var or__3824__auto____6908 = cljs.core._val["_"];
        if(or__3824__auto____6908) {
          return or__3824__auto____6908
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____6913 = coll;
    if(and__3822__auto____6913) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6913
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2418__auto____6914 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6915 = cljs.core._disjoin[goog.typeOf(x__2418__auto____6914)];
      if(or__3824__auto____6915) {
        return or__3824__auto____6915
      }else {
        var or__3824__auto____6916 = cljs.core._disjoin["_"];
        if(or__3824__auto____6916) {
          return or__3824__auto____6916
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____6921 = coll;
    if(and__3822__auto____6921) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6921
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2418__auto____6922 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6923 = cljs.core._peek[goog.typeOf(x__2418__auto____6922)];
      if(or__3824__auto____6923) {
        return or__3824__auto____6923
      }else {
        var or__3824__auto____6924 = cljs.core._peek["_"];
        if(or__3824__auto____6924) {
          return or__3824__auto____6924
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6929 = coll;
    if(and__3822__auto____6929) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6929
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2418__auto____6930 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6931 = cljs.core._pop[goog.typeOf(x__2418__auto____6930)];
      if(or__3824__auto____6931) {
        return or__3824__auto____6931
      }else {
        var or__3824__auto____6932 = cljs.core._pop["_"];
        if(or__3824__auto____6932) {
          return or__3824__auto____6932
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____6937 = coll;
    if(and__3822__auto____6937) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6937
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2418__auto____6938 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6939 = cljs.core._assoc_n[goog.typeOf(x__2418__auto____6938)];
      if(or__3824__auto____6939) {
        return or__3824__auto____6939
      }else {
        var or__3824__auto____6940 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6940) {
          return or__3824__auto____6940
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____6945 = o;
    if(and__3822__auto____6945) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6945
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2418__auto____6946 = o == null ? null : o;
    return function() {
      var or__3824__auto____6947 = cljs.core._deref[goog.typeOf(x__2418__auto____6946)];
      if(or__3824__auto____6947) {
        return or__3824__auto____6947
      }else {
        var or__3824__auto____6948 = cljs.core._deref["_"];
        if(or__3824__auto____6948) {
          return or__3824__auto____6948
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____6953 = o;
    if(and__3822__auto____6953) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6953
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2418__auto____6954 = o == null ? null : o;
    return function() {
      var or__3824__auto____6955 = cljs.core._deref_with_timeout[goog.typeOf(x__2418__auto____6954)];
      if(or__3824__auto____6955) {
        return or__3824__auto____6955
      }else {
        var or__3824__auto____6956 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6956) {
          return or__3824__auto____6956
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____6961 = o;
    if(and__3822__auto____6961) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6961
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2418__auto____6962 = o == null ? null : o;
    return function() {
      var or__3824__auto____6963 = cljs.core._meta[goog.typeOf(x__2418__auto____6962)];
      if(or__3824__auto____6963) {
        return or__3824__auto____6963
      }else {
        var or__3824__auto____6964 = cljs.core._meta["_"];
        if(or__3824__auto____6964) {
          return or__3824__auto____6964
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____6969 = o;
    if(and__3822__auto____6969) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6969
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2418__auto____6970 = o == null ? null : o;
    return function() {
      var or__3824__auto____6971 = cljs.core._with_meta[goog.typeOf(x__2418__auto____6970)];
      if(or__3824__auto____6971) {
        return or__3824__auto____6971
      }else {
        var or__3824__auto____6972 = cljs.core._with_meta["_"];
        if(or__3824__auto____6972) {
          return or__3824__auto____6972
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____6981 = coll;
      if(and__3822__auto____6981) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6981
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2418__auto____6982 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6983 = cljs.core._reduce[goog.typeOf(x__2418__auto____6982)];
        if(or__3824__auto____6983) {
          return or__3824__auto____6983
        }else {
          var or__3824__auto____6984 = cljs.core._reduce["_"];
          if(or__3824__auto____6984) {
            return or__3824__auto____6984
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6985 = coll;
      if(and__3822__auto____6985) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6985
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2418__auto____6986 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6987 = cljs.core._reduce[goog.typeOf(x__2418__auto____6986)];
        if(or__3824__auto____6987) {
          return or__3824__auto____6987
        }else {
          var or__3824__auto____6988 = cljs.core._reduce["_"];
          if(or__3824__auto____6988) {
            return or__3824__auto____6988
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____6993 = coll;
    if(and__3822__auto____6993) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6993
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2418__auto____6994 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6995 = cljs.core._kv_reduce[goog.typeOf(x__2418__auto____6994)];
      if(or__3824__auto____6995) {
        return or__3824__auto____6995
      }else {
        var or__3824__auto____6996 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6996) {
          return or__3824__auto____6996
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____7001 = o;
    if(and__3822__auto____7001) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____7001
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2418__auto____7002 = o == null ? null : o;
    return function() {
      var or__3824__auto____7003 = cljs.core._equiv[goog.typeOf(x__2418__auto____7002)];
      if(or__3824__auto____7003) {
        return or__3824__auto____7003
      }else {
        var or__3824__auto____7004 = cljs.core._equiv["_"];
        if(or__3824__auto____7004) {
          return or__3824__auto____7004
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____7009 = o;
    if(and__3822__auto____7009) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____7009
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2418__auto____7010 = o == null ? null : o;
    return function() {
      var or__3824__auto____7011 = cljs.core._hash[goog.typeOf(x__2418__auto____7010)];
      if(or__3824__auto____7011) {
        return or__3824__auto____7011
      }else {
        var or__3824__auto____7012 = cljs.core._hash["_"];
        if(or__3824__auto____7012) {
          return or__3824__auto____7012
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____7017 = o;
    if(and__3822__auto____7017) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____7017
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2418__auto____7018 = o == null ? null : o;
    return function() {
      var or__3824__auto____7019 = cljs.core._seq[goog.typeOf(x__2418__auto____7018)];
      if(or__3824__auto____7019) {
        return or__3824__auto____7019
      }else {
        var or__3824__auto____7020 = cljs.core._seq["_"];
        if(or__3824__auto____7020) {
          return or__3824__auto____7020
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____7025 = coll;
    if(and__3822__auto____7025) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____7025
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2418__auto____7026 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7027 = cljs.core._rseq[goog.typeOf(x__2418__auto____7026)];
      if(or__3824__auto____7027) {
        return or__3824__auto____7027
      }else {
        var or__3824__auto____7028 = cljs.core._rseq["_"];
        if(or__3824__auto____7028) {
          return or__3824__auto____7028
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____7033 = coll;
    if(and__3822__auto____7033) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____7033
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2418__auto____7034 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7035 = cljs.core._sorted_seq[goog.typeOf(x__2418__auto____7034)];
      if(or__3824__auto____7035) {
        return or__3824__auto____7035
      }else {
        var or__3824__auto____7036 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____7036) {
          return or__3824__auto____7036
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____7041 = coll;
    if(and__3822__auto____7041) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____7041
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2418__auto____7042 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7043 = cljs.core._sorted_seq_from[goog.typeOf(x__2418__auto____7042)];
      if(or__3824__auto____7043) {
        return or__3824__auto____7043
      }else {
        var or__3824__auto____7044 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____7044) {
          return or__3824__auto____7044
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____7049 = coll;
    if(and__3822__auto____7049) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____7049
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2418__auto____7050 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7051 = cljs.core._entry_key[goog.typeOf(x__2418__auto____7050)];
      if(or__3824__auto____7051) {
        return or__3824__auto____7051
      }else {
        var or__3824__auto____7052 = cljs.core._entry_key["_"];
        if(or__3824__auto____7052) {
          return or__3824__auto____7052
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____7057 = coll;
    if(and__3822__auto____7057) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____7057
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2418__auto____7058 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7059 = cljs.core._comparator[goog.typeOf(x__2418__auto____7058)];
      if(or__3824__auto____7059) {
        return or__3824__auto____7059
      }else {
        var or__3824__auto____7060 = cljs.core._comparator["_"];
        if(or__3824__auto____7060) {
          return or__3824__auto____7060
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____7065 = o;
    if(and__3822__auto____7065) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____7065
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2418__auto____7066 = o == null ? null : o;
    return function() {
      var or__3824__auto____7067 = cljs.core._pr_seq[goog.typeOf(x__2418__auto____7066)];
      if(or__3824__auto____7067) {
        return or__3824__auto____7067
      }else {
        var or__3824__auto____7068 = cljs.core._pr_seq["_"];
        if(or__3824__auto____7068) {
          return or__3824__auto____7068
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____7073 = d;
    if(and__3822__auto____7073) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____7073
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2418__auto____7074 = d == null ? null : d;
    return function() {
      var or__3824__auto____7075 = cljs.core._realized_QMARK_[goog.typeOf(x__2418__auto____7074)];
      if(or__3824__auto____7075) {
        return or__3824__auto____7075
      }else {
        var or__3824__auto____7076 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____7076) {
          return or__3824__auto____7076
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____7081 = this$;
    if(and__3822__auto____7081) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____7081
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2418__auto____7082 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7083 = cljs.core._notify_watches[goog.typeOf(x__2418__auto____7082)];
      if(or__3824__auto____7083) {
        return or__3824__auto____7083
      }else {
        var or__3824__auto____7084 = cljs.core._notify_watches["_"];
        if(or__3824__auto____7084) {
          return or__3824__auto____7084
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____7089 = this$;
    if(and__3822__auto____7089) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____7089
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2418__auto____7090 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7091 = cljs.core._add_watch[goog.typeOf(x__2418__auto____7090)];
      if(or__3824__auto____7091) {
        return or__3824__auto____7091
      }else {
        var or__3824__auto____7092 = cljs.core._add_watch["_"];
        if(or__3824__auto____7092) {
          return or__3824__auto____7092
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____7097 = this$;
    if(and__3822__auto____7097) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____7097
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2418__auto____7098 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7099 = cljs.core._remove_watch[goog.typeOf(x__2418__auto____7098)];
      if(or__3824__auto____7099) {
        return or__3824__auto____7099
      }else {
        var or__3824__auto____7100 = cljs.core._remove_watch["_"];
        if(or__3824__auto____7100) {
          return or__3824__auto____7100
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____7105 = coll;
    if(and__3822__auto____7105) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____7105
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2418__auto____7106 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7107 = cljs.core._as_transient[goog.typeOf(x__2418__auto____7106)];
      if(or__3824__auto____7107) {
        return or__3824__auto____7107
      }else {
        var or__3824__auto____7108 = cljs.core._as_transient["_"];
        if(or__3824__auto____7108) {
          return or__3824__auto____7108
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____7113 = tcoll;
    if(and__3822__auto____7113) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____7113
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2418__auto____7114 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7115 = cljs.core._conj_BANG_[goog.typeOf(x__2418__auto____7114)];
      if(or__3824__auto____7115) {
        return or__3824__auto____7115
      }else {
        var or__3824__auto____7116 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____7116) {
          return or__3824__auto____7116
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7121 = tcoll;
    if(and__3822__auto____7121) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____7121
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2418__auto____7122 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7123 = cljs.core._persistent_BANG_[goog.typeOf(x__2418__auto____7122)];
      if(or__3824__auto____7123) {
        return or__3824__auto____7123
      }else {
        var or__3824__auto____7124 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____7124) {
          return or__3824__auto____7124
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____7129 = tcoll;
    if(and__3822__auto____7129) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____7129
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2418__auto____7130 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7131 = cljs.core._assoc_BANG_[goog.typeOf(x__2418__auto____7130)];
      if(or__3824__auto____7131) {
        return or__3824__auto____7131
      }else {
        var or__3824__auto____7132 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____7132) {
          return or__3824__auto____7132
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____7137 = tcoll;
    if(and__3822__auto____7137) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____7137
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2418__auto____7138 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7139 = cljs.core._dissoc_BANG_[goog.typeOf(x__2418__auto____7138)];
      if(or__3824__auto____7139) {
        return or__3824__auto____7139
      }else {
        var or__3824__auto____7140 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____7140) {
          return or__3824__auto____7140
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____7145 = tcoll;
    if(and__3822__auto____7145) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____7145
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2418__auto____7146 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7147 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2418__auto____7146)];
      if(or__3824__auto____7147) {
        return or__3824__auto____7147
      }else {
        var or__3824__auto____7148 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____7148) {
          return or__3824__auto____7148
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7153 = tcoll;
    if(and__3822__auto____7153) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____7153
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2418__auto____7154 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7155 = cljs.core._pop_BANG_[goog.typeOf(x__2418__auto____7154)];
      if(or__3824__auto____7155) {
        return or__3824__auto____7155
      }else {
        var or__3824__auto____7156 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____7156) {
          return or__3824__auto____7156
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____7161 = tcoll;
    if(and__3822__auto____7161) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____7161
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2418__auto____7162 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7163 = cljs.core._disjoin_BANG_[goog.typeOf(x__2418__auto____7162)];
      if(or__3824__auto____7163) {
        return or__3824__auto____7163
      }else {
        var or__3824__auto____7164 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____7164) {
          return or__3824__auto____7164
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____7169 = x;
    if(and__3822__auto____7169) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____7169
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2418__auto____7170 = x == null ? null : x;
    return function() {
      var or__3824__auto____7171 = cljs.core._compare[goog.typeOf(x__2418__auto____7170)];
      if(or__3824__auto____7171) {
        return or__3824__auto____7171
      }else {
        var or__3824__auto____7172 = cljs.core._compare["_"];
        if(or__3824__auto____7172) {
          return or__3824__auto____7172
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____7177 = coll;
    if(and__3822__auto____7177) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____7177
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2418__auto____7178 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7179 = cljs.core._drop_first[goog.typeOf(x__2418__auto____7178)];
      if(or__3824__auto____7179) {
        return or__3824__auto____7179
      }else {
        var or__3824__auto____7180 = cljs.core._drop_first["_"];
        if(or__3824__auto____7180) {
          return or__3824__auto____7180
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____7185 = coll;
    if(and__3822__auto____7185) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____7185
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2418__auto____7186 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7187 = cljs.core._chunked_first[goog.typeOf(x__2418__auto____7186)];
      if(or__3824__auto____7187) {
        return or__3824__auto____7187
      }else {
        var or__3824__auto____7188 = cljs.core._chunked_first["_"];
        if(or__3824__auto____7188) {
          return or__3824__auto____7188
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____7193 = coll;
    if(and__3822__auto____7193) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____7193
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2418__auto____7194 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7195 = cljs.core._chunked_rest[goog.typeOf(x__2418__auto____7194)];
      if(or__3824__auto____7195) {
        return or__3824__auto____7195
      }else {
        var or__3824__auto____7196 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____7196) {
          return or__3824__auto____7196
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____7201 = coll;
    if(and__3822__auto____7201) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____7201
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2418__auto____7202 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7203 = cljs.core._chunked_next[goog.typeOf(x__2418__auto____7202)];
      if(or__3824__auto____7203) {
        return or__3824__auto____7203
      }else {
        var or__3824__auto____7204 = cljs.core._chunked_next["_"];
        if(or__3824__auto____7204) {
          return or__3824__auto____7204
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____7206 = x === y;
    if(or__3824__auto____7206) {
      return or__3824__auto____7206
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__7207__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7208 = y;
            var G__7209 = cljs.core.first.call(null, more);
            var G__7210 = cljs.core.next.call(null, more);
            x = G__7208;
            y = G__7209;
            more = G__7210;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7207 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7207__delegate.call(this, x, y, more)
    };
    G__7207.cljs$lang$maxFixedArity = 2;
    G__7207.cljs$lang$applyTo = function(arglist__7211) {
      var x = cljs.core.first(arglist__7211);
      var y = cljs.core.first(cljs.core.next(arglist__7211));
      var more = cljs.core.rest(cljs.core.next(arglist__7211));
      return G__7207__delegate(x, y, more)
    };
    G__7207.cljs$lang$arity$variadic = G__7207__delegate;
    return G__7207
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__7212 = null;
  var G__7212__2 = function(o, k) {
    return null
  };
  var G__7212__3 = function(o, k, not_found) {
    return not_found
  };
  G__7212 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7212__2.call(this, o, k);
      case 3:
        return G__7212__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7212
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__7213 = null;
  var G__7213__2 = function(_, f) {
    return f.call(null)
  };
  var G__7213__3 = function(_, f, start) {
    return start
  };
  G__7213 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7213__2.call(this, _, f);
      case 3:
        return G__7213__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7213
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__7214 = null;
  var G__7214__2 = function(_, n) {
    return null
  };
  var G__7214__3 = function(_, n, not_found) {
    return not_found
  };
  G__7214 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7214__2.call(this, _, n);
      case 3:
        return G__7214__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7214
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____7215 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____7215) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____7215
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__7228 = cljs.core._count.call(null, cicoll);
    if(cnt__7228 === 0) {
      return f.call(null)
    }else {
      var val__7229 = cljs.core._nth.call(null, cicoll, 0);
      var n__7230 = 1;
      while(true) {
        if(n__7230 < cnt__7228) {
          var nval__7231 = f.call(null, val__7229, cljs.core._nth.call(null, cicoll, n__7230));
          if(cljs.core.reduced_QMARK_.call(null, nval__7231)) {
            return cljs.core.deref.call(null, nval__7231)
          }else {
            var G__7240 = nval__7231;
            var G__7241 = n__7230 + 1;
            val__7229 = G__7240;
            n__7230 = G__7241;
            continue
          }
        }else {
          return val__7229
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__7232 = cljs.core._count.call(null, cicoll);
    var val__7233 = val;
    var n__7234 = 0;
    while(true) {
      if(n__7234 < cnt__7232) {
        var nval__7235 = f.call(null, val__7233, cljs.core._nth.call(null, cicoll, n__7234));
        if(cljs.core.reduced_QMARK_.call(null, nval__7235)) {
          return cljs.core.deref.call(null, nval__7235)
        }else {
          var G__7242 = nval__7235;
          var G__7243 = n__7234 + 1;
          val__7233 = G__7242;
          n__7234 = G__7243;
          continue
        }
      }else {
        return val__7233
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__7236 = cljs.core._count.call(null, cicoll);
    var val__7237 = val;
    var n__7238 = idx;
    while(true) {
      if(n__7238 < cnt__7236) {
        var nval__7239 = f.call(null, val__7237, cljs.core._nth.call(null, cicoll, n__7238));
        if(cljs.core.reduced_QMARK_.call(null, nval__7239)) {
          return cljs.core.deref.call(null, nval__7239)
        }else {
          var G__7244 = nval__7239;
          var G__7245 = n__7238 + 1;
          val__7237 = G__7244;
          n__7238 = G__7245;
          continue
        }
      }else {
        return val__7237
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__7258 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__7259 = arr[0];
      var n__7260 = 1;
      while(true) {
        if(n__7260 < cnt__7258) {
          var nval__7261 = f.call(null, val__7259, arr[n__7260]);
          if(cljs.core.reduced_QMARK_.call(null, nval__7261)) {
            return cljs.core.deref.call(null, nval__7261)
          }else {
            var G__7270 = nval__7261;
            var G__7271 = n__7260 + 1;
            val__7259 = G__7270;
            n__7260 = G__7271;
            continue
          }
        }else {
          return val__7259
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__7262 = arr.length;
    var val__7263 = val;
    var n__7264 = 0;
    while(true) {
      if(n__7264 < cnt__7262) {
        var nval__7265 = f.call(null, val__7263, arr[n__7264]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7265)) {
          return cljs.core.deref.call(null, nval__7265)
        }else {
          var G__7272 = nval__7265;
          var G__7273 = n__7264 + 1;
          val__7263 = G__7272;
          n__7264 = G__7273;
          continue
        }
      }else {
        return val__7263
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__7266 = arr.length;
    var val__7267 = val;
    var n__7268 = idx;
    while(true) {
      if(n__7268 < cnt__7266) {
        var nval__7269 = f.call(null, val__7267, arr[n__7268]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7269)) {
          return cljs.core.deref.call(null, nval__7269)
        }else {
          var G__7274 = nval__7269;
          var G__7275 = n__7268 + 1;
          val__7267 = G__7274;
          n__7268 = G__7275;
          continue
        }
      }else {
        return val__7267
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7276 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__7277 = this;
  if(this__7277.i + 1 < this__7277.a.length) {
    return new cljs.core.IndexedSeq(this__7277.a, this__7277.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7278 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__7279 = this;
  var c__7280 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__7280 > 0) {
    return new cljs.core.RSeq(coll, c__7280 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__7281 = this;
  var this__7282 = this;
  return cljs.core.pr_str.call(null, this__7282)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7283 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7283.a)) {
    return cljs.core.ci_reduce.call(null, this__7283.a, f, this__7283.a[this__7283.i], this__7283.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__7283.a[this__7283.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7284 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7284.a)) {
    return cljs.core.ci_reduce.call(null, this__7284.a, f, start, this__7284.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__7285 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7286 = this;
  return this__7286.a.length - this__7286.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__7287 = this;
  return this__7287.a[this__7287.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__7288 = this;
  if(this__7288.i + 1 < this__7288.a.length) {
    return new cljs.core.IndexedSeq(this__7288.a, this__7288.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7289 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7290 = this;
  var i__7291 = n + this__7290.i;
  if(i__7291 < this__7290.a.length) {
    return this__7290.a[i__7291]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7292 = this;
  var i__7293 = n + this__7292.i;
  if(i__7293 < this__7292.a.length) {
    return this__7292.a[i__7293]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__7294 = null;
  var G__7294__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__7294__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__7294 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7294__2.call(this, array, f);
      case 3:
        return G__7294__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7294
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__7295 = null;
  var G__7295__2 = function(array, k) {
    return array[k]
  };
  var G__7295__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__7295 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7295__2.call(this, array, k);
      case 3:
        return G__7295__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7295
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__7296 = null;
  var G__7296__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__7296__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__7296 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7296__2.call(this, array, n);
      case 3:
        return G__7296__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7296
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7297 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7298 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__7299 = this;
  var this__7300 = this;
  return cljs.core.pr_str.call(null, this__7300)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7301 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7302 = this;
  return this__7302.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7303 = this;
  return cljs.core._nth.call(null, this__7303.ci, this__7303.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7304 = this;
  if(this__7304.i > 0) {
    return new cljs.core.RSeq(this__7304.ci, this__7304.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7305 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__7306 = this;
  return new cljs.core.RSeq(this__7306.ci, this__7306.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7307 = this;
  return this__7307.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7311__7312 = coll;
      if(G__7311__7312) {
        if(function() {
          var or__3824__auto____7313 = G__7311__7312.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____7313) {
            return or__3824__auto____7313
          }else {
            return G__7311__7312.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__7311__7312.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7311__7312)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7311__7312)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7318__7319 = coll;
      if(G__7318__7319) {
        if(function() {
          var or__3824__auto____7320 = G__7318__7319.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7320) {
            return or__3824__auto____7320
          }else {
            return G__7318__7319.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7318__7319.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7318__7319)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7318__7319)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__7321 = cljs.core.seq.call(null, coll);
      if(s__7321 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__7321)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__7326__7327 = coll;
      if(G__7326__7327) {
        if(function() {
          var or__3824__auto____7328 = G__7326__7327.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7328) {
            return or__3824__auto____7328
          }else {
            return G__7326__7327.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7326__7327.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7326__7327)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7326__7327)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__7329 = cljs.core.seq.call(null, coll);
      if(!(s__7329 == null)) {
        return cljs.core._rest.call(null, s__7329)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7333__7334 = coll;
      if(G__7333__7334) {
        if(function() {
          var or__3824__auto____7335 = G__7333__7334.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____7335) {
            return or__3824__auto____7335
          }else {
            return G__7333__7334.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__7333__7334.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7333__7334)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7333__7334)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__7337 = cljs.core.next.call(null, s);
    if(!(sn__7337 == null)) {
      var G__7338 = sn__7337;
      s = G__7338;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__7339__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__7340 = conj.call(null, coll, x);
          var G__7341 = cljs.core.first.call(null, xs);
          var G__7342 = cljs.core.next.call(null, xs);
          coll = G__7340;
          x = G__7341;
          xs = G__7342;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__7339 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7339__delegate.call(this, coll, x, xs)
    };
    G__7339.cljs$lang$maxFixedArity = 2;
    G__7339.cljs$lang$applyTo = function(arglist__7343) {
      var coll = cljs.core.first(arglist__7343);
      var x = cljs.core.first(cljs.core.next(arglist__7343));
      var xs = cljs.core.rest(cljs.core.next(arglist__7343));
      return G__7339__delegate(coll, x, xs)
    };
    G__7339.cljs$lang$arity$variadic = G__7339__delegate;
    return G__7339
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__7346 = cljs.core.seq.call(null, coll);
  var acc__7347 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__7346)) {
      return acc__7347 + cljs.core._count.call(null, s__7346)
    }else {
      var G__7348 = cljs.core.next.call(null, s__7346);
      var G__7349 = acc__7347 + 1;
      s__7346 = G__7348;
      acc__7347 = G__7349;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__7356__7357 = coll;
        if(G__7356__7357) {
          if(function() {
            var or__3824__auto____7358 = G__7356__7357.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7358) {
              return or__3824__auto____7358
            }else {
              return G__7356__7357.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7356__7357.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7356__7357)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7356__7357)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__7359__7360 = coll;
        if(G__7359__7360) {
          if(function() {
            var or__3824__auto____7361 = G__7359__7360.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7361) {
              return or__3824__auto____7361
            }else {
              return G__7359__7360.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7359__7360.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7359__7360)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7359__7360)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__7364__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__7363 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__7365 = ret__7363;
          var G__7366 = cljs.core.first.call(null, kvs);
          var G__7367 = cljs.core.second.call(null, kvs);
          var G__7368 = cljs.core.nnext.call(null, kvs);
          coll = G__7365;
          k = G__7366;
          v = G__7367;
          kvs = G__7368;
          continue
        }else {
          return ret__7363
        }
        break
      }
    };
    var G__7364 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7364__delegate.call(this, coll, k, v, kvs)
    };
    G__7364.cljs$lang$maxFixedArity = 3;
    G__7364.cljs$lang$applyTo = function(arglist__7369) {
      var coll = cljs.core.first(arglist__7369);
      var k = cljs.core.first(cljs.core.next(arglist__7369));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7369)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7369)));
      return G__7364__delegate(coll, k, v, kvs)
    };
    G__7364.cljs$lang$arity$variadic = G__7364__delegate;
    return G__7364
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__7372__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7371 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7373 = ret__7371;
          var G__7374 = cljs.core.first.call(null, ks);
          var G__7375 = cljs.core.next.call(null, ks);
          coll = G__7373;
          k = G__7374;
          ks = G__7375;
          continue
        }else {
          return ret__7371
        }
        break
      }
    };
    var G__7372 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7372__delegate.call(this, coll, k, ks)
    };
    G__7372.cljs$lang$maxFixedArity = 2;
    G__7372.cljs$lang$applyTo = function(arglist__7376) {
      var coll = cljs.core.first(arglist__7376);
      var k = cljs.core.first(cljs.core.next(arglist__7376));
      var ks = cljs.core.rest(cljs.core.next(arglist__7376));
      return G__7372__delegate(coll, k, ks)
    };
    G__7372.cljs$lang$arity$variadic = G__7372__delegate;
    return G__7372
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__7380__7381 = o;
    if(G__7380__7381) {
      if(function() {
        var or__3824__auto____7382 = G__7380__7381.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____7382) {
          return or__3824__auto____7382
        }else {
          return G__7380__7381.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__7380__7381.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7380__7381)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7380__7381)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__7385__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7384 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7386 = ret__7384;
          var G__7387 = cljs.core.first.call(null, ks);
          var G__7388 = cljs.core.next.call(null, ks);
          coll = G__7386;
          k = G__7387;
          ks = G__7388;
          continue
        }else {
          return ret__7384
        }
        break
      }
    };
    var G__7385 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7385__delegate.call(this, coll, k, ks)
    };
    G__7385.cljs$lang$maxFixedArity = 2;
    G__7385.cljs$lang$applyTo = function(arglist__7389) {
      var coll = cljs.core.first(arglist__7389);
      var k = cljs.core.first(cljs.core.next(arglist__7389));
      var ks = cljs.core.rest(cljs.core.next(arglist__7389));
      return G__7385__delegate(coll, k, ks)
    };
    G__7385.cljs$lang$arity$variadic = G__7385__delegate;
    return G__7385
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__7391 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__7391;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__7391
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__7393 = cljs.core.string_hash_cache[k];
  if(!(h__7393 == null)) {
    return h__7393
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____7395 = goog.isString(o);
      if(and__3822__auto____7395) {
        return check_cache
      }else {
        return and__3822__auto____7395
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7399__7400 = x;
    if(G__7399__7400) {
      if(function() {
        var or__3824__auto____7401 = G__7399__7400.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____7401) {
          return or__3824__auto____7401
        }else {
          return G__7399__7400.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__7399__7400.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7399__7400)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7399__7400)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7405__7406 = x;
    if(G__7405__7406) {
      if(function() {
        var or__3824__auto____7407 = G__7405__7406.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____7407) {
          return or__3824__auto____7407
        }else {
          return G__7405__7406.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__7405__7406.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7405__7406)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7405__7406)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__7411__7412 = x;
  if(G__7411__7412) {
    if(function() {
      var or__3824__auto____7413 = G__7411__7412.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____7413) {
        return or__3824__auto____7413
      }else {
        return G__7411__7412.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__7411__7412.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7411__7412)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7411__7412)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__7417__7418 = x;
  if(G__7417__7418) {
    if(function() {
      var or__3824__auto____7419 = G__7417__7418.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____7419) {
        return or__3824__auto____7419
      }else {
        return G__7417__7418.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__7417__7418.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7417__7418)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7417__7418)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__7423__7424 = x;
  if(G__7423__7424) {
    if(function() {
      var or__3824__auto____7425 = G__7423__7424.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____7425) {
        return or__3824__auto____7425
      }else {
        return G__7423__7424.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__7423__7424.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7423__7424)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7423__7424)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__7429__7430 = x;
  if(G__7429__7430) {
    if(function() {
      var or__3824__auto____7431 = G__7429__7430.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____7431) {
        return or__3824__auto____7431
      }else {
        return G__7429__7430.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__7429__7430.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7429__7430)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7429__7430)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__7435__7436 = x;
  if(G__7435__7436) {
    if(function() {
      var or__3824__auto____7437 = G__7435__7436.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____7437) {
        return or__3824__auto____7437
      }else {
        return G__7435__7436.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__7435__7436.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7435__7436)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7435__7436)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7441__7442 = x;
    if(G__7441__7442) {
      if(function() {
        var or__3824__auto____7443 = G__7441__7442.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____7443) {
          return or__3824__auto____7443
        }else {
          return G__7441__7442.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__7441__7442.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7441__7442)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7441__7442)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__7447__7448 = x;
  if(G__7447__7448) {
    if(function() {
      var or__3824__auto____7449 = G__7447__7448.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____7449) {
        return or__3824__auto____7449
      }else {
        return G__7447__7448.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__7447__7448.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7447__7448)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7447__7448)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__7453__7454 = x;
  if(G__7453__7454) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____7455 = null;
      if(cljs.core.truth_(or__3824__auto____7455)) {
        return or__3824__auto____7455
      }else {
        return G__7453__7454.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__7453__7454.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7453__7454)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7453__7454)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__7456__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__7456 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7456__delegate.call(this, keyvals)
    };
    G__7456.cljs$lang$maxFixedArity = 0;
    G__7456.cljs$lang$applyTo = function(arglist__7457) {
      var keyvals = cljs.core.seq(arglist__7457);
      return G__7456__delegate(keyvals)
    };
    G__7456.cljs$lang$arity$variadic = G__7456__delegate;
    return G__7456
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__7459 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__7459.push(key)
  });
  return keys__7459
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__7463 = i;
  var j__7464 = j;
  var len__7465 = len;
  while(true) {
    if(len__7465 === 0) {
      return to
    }else {
      to[j__7464] = from[i__7463];
      var G__7466 = i__7463 + 1;
      var G__7467 = j__7464 + 1;
      var G__7468 = len__7465 - 1;
      i__7463 = G__7466;
      j__7464 = G__7467;
      len__7465 = G__7468;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__7472 = i + (len - 1);
  var j__7473 = j + (len - 1);
  var len__7474 = len;
  while(true) {
    if(len__7474 === 0) {
      return to
    }else {
      to[j__7473] = from[i__7472];
      var G__7475 = i__7472 - 1;
      var G__7476 = j__7473 - 1;
      var G__7477 = len__7474 - 1;
      i__7472 = G__7475;
      j__7473 = G__7476;
      len__7474 = G__7477;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__7481__7482 = s;
    if(G__7481__7482) {
      if(function() {
        var or__3824__auto____7483 = G__7481__7482.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____7483) {
          return or__3824__auto____7483
        }else {
          return G__7481__7482.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__7481__7482.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7481__7482)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7481__7482)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7487__7488 = s;
  if(G__7487__7488) {
    if(function() {
      var or__3824__auto____7489 = G__7487__7488.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____7489) {
        return or__3824__auto____7489
      }else {
        return G__7487__7488.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7487__7488.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7487__7488)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7487__7488)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____7492 = goog.isString(x);
  if(and__3822__auto____7492) {
    return!function() {
      var or__3824__auto____7493 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7493) {
        return or__3824__auto____7493
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7492
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7495 = goog.isString(x);
  if(and__3822__auto____7495) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7495
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7497 = goog.isString(x);
  if(and__3822__auto____7497) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7497
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7502 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____7502) {
    return or__3824__auto____7502
  }else {
    var G__7503__7504 = f;
    if(G__7503__7504) {
      if(function() {
        var or__3824__auto____7505 = G__7503__7504.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7505) {
          return or__3824__auto____7505
        }else {
          return G__7503__7504.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7503__7504.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7503__7504)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7503__7504)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7507 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7507) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7507
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____7510 = coll;
    if(cljs.core.truth_(and__3822__auto____7510)) {
      var and__3822__auto____7511 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7511) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7511
      }
    }else {
      return and__3822__auto____7510
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__7520__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7516 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7517 = more;
        while(true) {
          var x__7518 = cljs.core.first.call(null, xs__7517);
          var etc__7519 = cljs.core.next.call(null, xs__7517);
          if(cljs.core.truth_(xs__7517)) {
            if(cljs.core.contains_QMARK_.call(null, s__7516, x__7518)) {
              return false
            }else {
              var G__7521 = cljs.core.conj.call(null, s__7516, x__7518);
              var G__7522 = etc__7519;
              s__7516 = G__7521;
              xs__7517 = G__7522;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__7520 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7520__delegate.call(this, x, y, more)
    };
    G__7520.cljs$lang$maxFixedArity = 2;
    G__7520.cljs$lang$applyTo = function(arglist__7523) {
      var x = cljs.core.first(arglist__7523);
      var y = cljs.core.first(cljs.core.next(arglist__7523));
      var more = cljs.core.rest(cljs.core.next(arglist__7523));
      return G__7520__delegate(x, y, more)
    };
    G__7520.cljs$lang$arity$variadic = G__7520__delegate;
    return G__7520
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__7527__7528 = x;
            if(G__7527__7528) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7529 = null;
                if(cljs.core.truth_(or__3824__auto____7529)) {
                  return or__3824__auto____7529
                }else {
                  return G__7527__7528.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7527__7528.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7527__7528)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7527__7528)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__7534 = cljs.core.count.call(null, xs);
    var yl__7535 = cljs.core.count.call(null, ys);
    if(xl__7534 < yl__7535) {
      return-1
    }else {
      if(xl__7534 > yl__7535) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7534, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7536 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7537 = d__7536 === 0;
        if(and__3822__auto____7537) {
          return n + 1 < len
        }else {
          return and__3822__auto____7537
        }
      }()) {
        var G__7538 = xs;
        var G__7539 = ys;
        var G__7540 = len;
        var G__7541 = n + 1;
        xs = G__7538;
        ys = G__7539;
        len = G__7540;
        n = G__7541;
        continue
      }else {
        return d__7536
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7543 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7543)) {
        return r__7543
      }else {
        if(cljs.core.truth_(r__7543)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__7545 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7545, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7545)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____7551 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7551) {
      var s__7552 = temp__3971__auto____7551;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7552), cljs.core.next.call(null, s__7552))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7553 = val;
    var coll__7554 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7554) {
        var nval__7555 = f.call(null, val__7553, cljs.core.first.call(null, coll__7554));
        if(cljs.core.reduced_QMARK_.call(null, nval__7555)) {
          return cljs.core.deref.call(null, nval__7555)
        }else {
          var G__7556 = nval__7555;
          var G__7557 = cljs.core.next.call(null, coll__7554);
          val__7553 = G__7556;
          coll__7554 = G__7557;
          continue
        }
      }else {
        return val__7553
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__7559 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7559);
  return cljs.core.vec.call(null, a__7559)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7566__7567 = coll;
      if(G__7566__7567) {
        if(function() {
          var or__3824__auto____7568 = G__7566__7567.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7568) {
            return or__3824__auto____7568
          }else {
            return G__7566__7567.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7566__7567.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7566__7567)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7566__7567)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7569__7570 = coll;
      if(G__7569__7570) {
        if(function() {
          var or__3824__auto____7571 = G__7569__7570.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7571) {
            return or__3824__auto____7571
          }else {
            return G__7569__7570.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7569__7570.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7569__7570)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7569__7570)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7572 = this;
  return this__7572.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__7573__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7573 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7573__delegate.call(this, x, y, more)
    };
    G__7573.cljs$lang$maxFixedArity = 2;
    G__7573.cljs$lang$applyTo = function(arglist__7574) {
      var x = cljs.core.first(arglist__7574);
      var y = cljs.core.first(cljs.core.next(arglist__7574));
      var more = cljs.core.rest(cljs.core.next(arglist__7574));
      return G__7573__delegate(x, y, more)
    };
    G__7573.cljs$lang$arity$variadic = G__7573__delegate;
    return G__7573
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__7575__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7575 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7575__delegate.call(this, x, y, more)
    };
    G__7575.cljs$lang$maxFixedArity = 2;
    G__7575.cljs$lang$applyTo = function(arglist__7576) {
      var x = cljs.core.first(arglist__7576);
      var y = cljs.core.first(cljs.core.next(arglist__7576));
      var more = cljs.core.rest(cljs.core.next(arglist__7576));
      return G__7575__delegate(x, y, more)
    };
    G__7575.cljs$lang$arity$variadic = G__7575__delegate;
    return G__7575
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__7577__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7577 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7577__delegate.call(this, x, y, more)
    };
    G__7577.cljs$lang$maxFixedArity = 2;
    G__7577.cljs$lang$applyTo = function(arglist__7578) {
      var x = cljs.core.first(arglist__7578);
      var y = cljs.core.first(cljs.core.next(arglist__7578));
      var more = cljs.core.rest(cljs.core.next(arglist__7578));
      return G__7577__delegate(x, y, more)
    };
    G__7577.cljs$lang$arity$variadic = G__7577__delegate;
    return G__7577
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7579__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7579 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7579__delegate.call(this, x, y, more)
    };
    G__7579.cljs$lang$maxFixedArity = 2;
    G__7579.cljs$lang$applyTo = function(arglist__7580) {
      var x = cljs.core.first(arglist__7580);
      var y = cljs.core.first(cljs.core.next(arglist__7580));
      var more = cljs.core.rest(cljs.core.next(arglist__7580));
      return G__7579__delegate(x, y, more)
    };
    G__7579.cljs$lang$arity$variadic = G__7579__delegate;
    return G__7579
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__7581__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7582 = y;
            var G__7583 = cljs.core.first.call(null, more);
            var G__7584 = cljs.core.next.call(null, more);
            x = G__7582;
            y = G__7583;
            more = G__7584;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7581 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7581__delegate.call(this, x, y, more)
    };
    G__7581.cljs$lang$maxFixedArity = 2;
    G__7581.cljs$lang$applyTo = function(arglist__7585) {
      var x = cljs.core.first(arglist__7585);
      var y = cljs.core.first(cljs.core.next(arglist__7585));
      var more = cljs.core.rest(cljs.core.next(arglist__7585));
      return G__7581__delegate(x, y, more)
    };
    G__7581.cljs$lang$arity$variadic = G__7581__delegate;
    return G__7581
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__7586__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7587 = y;
            var G__7588 = cljs.core.first.call(null, more);
            var G__7589 = cljs.core.next.call(null, more);
            x = G__7587;
            y = G__7588;
            more = G__7589;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7586 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7586__delegate.call(this, x, y, more)
    };
    G__7586.cljs$lang$maxFixedArity = 2;
    G__7586.cljs$lang$applyTo = function(arglist__7590) {
      var x = cljs.core.first(arglist__7590);
      var y = cljs.core.first(cljs.core.next(arglist__7590));
      var more = cljs.core.rest(cljs.core.next(arglist__7590));
      return G__7586__delegate(x, y, more)
    };
    G__7586.cljs$lang$arity$variadic = G__7586__delegate;
    return G__7586
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__7591__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7592 = y;
            var G__7593 = cljs.core.first.call(null, more);
            var G__7594 = cljs.core.next.call(null, more);
            x = G__7592;
            y = G__7593;
            more = G__7594;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7591 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7591__delegate.call(this, x, y, more)
    };
    G__7591.cljs$lang$maxFixedArity = 2;
    G__7591.cljs$lang$applyTo = function(arglist__7595) {
      var x = cljs.core.first(arglist__7595);
      var y = cljs.core.first(cljs.core.next(arglist__7595));
      var more = cljs.core.rest(cljs.core.next(arglist__7595));
      return G__7591__delegate(x, y, more)
    };
    G__7591.cljs$lang$arity$variadic = G__7591__delegate;
    return G__7591
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__7596__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7597 = y;
            var G__7598 = cljs.core.first.call(null, more);
            var G__7599 = cljs.core.next.call(null, more);
            x = G__7597;
            y = G__7598;
            more = G__7599;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7596 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7596__delegate.call(this, x, y, more)
    };
    G__7596.cljs$lang$maxFixedArity = 2;
    G__7596.cljs$lang$applyTo = function(arglist__7600) {
      var x = cljs.core.first(arglist__7600);
      var y = cljs.core.first(cljs.core.next(arglist__7600));
      var more = cljs.core.rest(cljs.core.next(arglist__7600));
      return G__7596__delegate(x, y, more)
    };
    G__7596.cljs$lang$arity$variadic = G__7596__delegate;
    return G__7596
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7601__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7601 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7601__delegate.call(this, x, y, more)
    };
    G__7601.cljs$lang$maxFixedArity = 2;
    G__7601.cljs$lang$applyTo = function(arglist__7602) {
      var x = cljs.core.first(arglist__7602);
      var y = cljs.core.first(cljs.core.next(arglist__7602));
      var more = cljs.core.rest(cljs.core.next(arglist__7602));
      return G__7601__delegate(x, y, more)
    };
    G__7601.cljs$lang$arity$variadic = G__7601__delegate;
    return G__7601
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7603__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7603 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7603__delegate.call(this, x, y, more)
    };
    G__7603.cljs$lang$maxFixedArity = 2;
    G__7603.cljs$lang$applyTo = function(arglist__7604) {
      var x = cljs.core.first(arglist__7604);
      var y = cljs.core.first(cljs.core.next(arglist__7604));
      var more = cljs.core.rest(cljs.core.next(arglist__7604));
      return G__7603__delegate(x, y, more)
    };
    G__7603.cljs$lang$arity$variadic = G__7603__delegate;
    return G__7603
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7606 = n % d;
  return cljs.core.fix.call(null, (n - rem__7606) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7608 = cljs.core.quot.call(null, n, d);
  return n - d * q__7608
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__7611 = v - (v >> 1 & 1431655765);
  var v__7612 = (v__7611 & 858993459) + (v__7611 >> 2 & 858993459);
  return(v__7612 + (v__7612 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7613__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7614 = y;
            var G__7615 = cljs.core.first.call(null, more);
            var G__7616 = cljs.core.next.call(null, more);
            x = G__7614;
            y = G__7615;
            more = G__7616;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7613 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7613__delegate.call(this, x, y, more)
    };
    G__7613.cljs$lang$maxFixedArity = 2;
    G__7613.cljs$lang$applyTo = function(arglist__7617) {
      var x = cljs.core.first(arglist__7617);
      var y = cljs.core.first(cljs.core.next(arglist__7617));
      var more = cljs.core.rest(cljs.core.next(arglist__7617));
      return G__7613__delegate(x, y, more)
    };
    G__7613.cljs$lang$arity$variadic = G__7613__delegate;
    return G__7613
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__7621 = n;
  var xs__7622 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7623 = xs__7622;
      if(and__3822__auto____7623) {
        return n__7621 > 0
      }else {
        return and__3822__auto____7623
      }
    }())) {
      var G__7624 = n__7621 - 1;
      var G__7625 = cljs.core.next.call(null, xs__7622);
      n__7621 = G__7624;
      xs__7622 = G__7625;
      continue
    }else {
      return xs__7622
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7626__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7627 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7628 = cljs.core.next.call(null, more);
            sb = G__7627;
            more = G__7628;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7626 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7626__delegate.call(this, x, ys)
    };
    G__7626.cljs$lang$maxFixedArity = 1;
    G__7626.cljs$lang$applyTo = function(arglist__7629) {
      var x = cljs.core.first(arglist__7629);
      var ys = cljs.core.rest(arglist__7629);
      return G__7626__delegate(x, ys)
    };
    G__7626.cljs$lang$arity$variadic = G__7626__delegate;
    return G__7626
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__7630__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7631 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7632 = cljs.core.next.call(null, more);
            sb = G__7631;
            more = G__7632;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7630 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7630__delegate.call(this, x, ys)
    };
    G__7630.cljs$lang$maxFixedArity = 1;
    G__7630.cljs$lang$applyTo = function(arglist__7633) {
      var x = cljs.core.first(arglist__7633);
      var ys = cljs.core.rest(arglist__7633);
      return G__7630__delegate(x, ys)
    };
    G__7630.cljs$lang$arity$variadic = G__7630__delegate;
    return G__7630
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7634) {
    var fmt = cljs.core.first(arglist__7634);
    var args = cljs.core.rest(arglist__7634);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__7637 = cljs.core.seq.call(null, x);
    var ys__7638 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7637 == null) {
        return ys__7638 == null
      }else {
        if(ys__7638 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7637), cljs.core.first.call(null, ys__7638))) {
            var G__7639 = cljs.core.next.call(null, xs__7637);
            var G__7640 = cljs.core.next.call(null, ys__7638);
            xs__7637 = G__7639;
            ys__7638 = G__7640;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__7641_SHARP_, p2__7642_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7641_SHARP_, cljs.core.hash.call(null, p2__7642_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7646 = 0;
  var s__7647 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7647) {
      var e__7648 = cljs.core.first.call(null, s__7647);
      var G__7649 = (h__7646 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7648)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7648)))) % 4503599627370496;
      var G__7650 = cljs.core.next.call(null, s__7647);
      h__7646 = G__7649;
      s__7647 = G__7650;
      continue
    }else {
      return h__7646
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7654 = 0;
  var s__7655 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7655) {
      var e__7656 = cljs.core.first.call(null, s__7655);
      var G__7657 = (h__7654 + cljs.core.hash.call(null, e__7656)) % 4503599627370496;
      var G__7658 = cljs.core.next.call(null, s__7655);
      h__7654 = G__7657;
      s__7655 = G__7658;
      continue
    }else {
      return h__7654
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7679__7680 = cljs.core.seq.call(null, fn_map);
  if(G__7679__7680) {
    var G__7682__7684 = cljs.core.first.call(null, G__7679__7680);
    var vec__7683__7685 = G__7682__7684;
    var key_name__7686 = cljs.core.nth.call(null, vec__7683__7685, 0, null);
    var f__7687 = cljs.core.nth.call(null, vec__7683__7685, 1, null);
    var G__7679__7688 = G__7679__7680;
    var G__7682__7689 = G__7682__7684;
    var G__7679__7690 = G__7679__7688;
    while(true) {
      var vec__7691__7692 = G__7682__7689;
      var key_name__7693 = cljs.core.nth.call(null, vec__7691__7692, 0, null);
      var f__7694 = cljs.core.nth.call(null, vec__7691__7692, 1, null);
      var G__7679__7695 = G__7679__7690;
      var str_name__7696 = cljs.core.name.call(null, key_name__7693);
      obj[str_name__7696] = f__7694;
      var temp__3974__auto____7697 = cljs.core.next.call(null, G__7679__7695);
      if(temp__3974__auto____7697) {
        var G__7679__7698 = temp__3974__auto____7697;
        var G__7699 = cljs.core.first.call(null, G__7679__7698);
        var G__7700 = G__7679__7698;
        G__7682__7689 = G__7699;
        G__7679__7690 = G__7700;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7701 = this;
  var h__2247__auto____7702 = this__7701.__hash;
  if(!(h__2247__auto____7702 == null)) {
    return h__2247__auto____7702
  }else {
    var h__2247__auto____7703 = cljs.core.hash_coll.call(null, coll);
    this__7701.__hash = h__2247__auto____7703;
    return h__2247__auto____7703
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7704 = this;
  if(this__7704.count === 1) {
    return null
  }else {
    return this__7704.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7705 = this;
  return new cljs.core.List(this__7705.meta, o, coll, this__7705.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7706 = this;
  var this__7707 = this;
  return cljs.core.pr_str.call(null, this__7707)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7708 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7709 = this;
  return this__7709.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7710 = this;
  return this__7710.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7711 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7712 = this;
  return this__7712.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7713 = this;
  if(this__7713.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7713.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7714 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7715 = this;
  return new cljs.core.List(meta, this__7715.first, this__7715.rest, this__7715.count, this__7715.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7716 = this;
  return this__7716.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7717 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7718 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7719 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7720 = this;
  return new cljs.core.List(this__7720.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7721 = this;
  var this__7722 = this;
  return cljs.core.pr_str.call(null, this__7722)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7723 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7724 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7725 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7726 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7727 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7728 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7729 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7730 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7731 = this;
  return this__7731.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7732 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7736__7737 = coll;
  if(G__7736__7737) {
    if(function() {
      var or__3824__auto____7738 = G__7736__7737.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7738) {
        return or__3824__auto____7738
      }else {
        return G__7736__7737.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7736__7737.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7736__7737)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7736__7737)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__7739__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7739 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7739__delegate.call(this, x, y, z, items)
    };
    G__7739.cljs$lang$maxFixedArity = 3;
    G__7739.cljs$lang$applyTo = function(arglist__7740) {
      var x = cljs.core.first(arglist__7740);
      var y = cljs.core.first(cljs.core.next(arglist__7740));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7740)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7740)));
      return G__7739__delegate(x, y, z, items)
    };
    G__7739.cljs$lang$arity$variadic = G__7739__delegate;
    return G__7739
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7741 = this;
  var h__2247__auto____7742 = this__7741.__hash;
  if(!(h__2247__auto____7742 == null)) {
    return h__2247__auto____7742
  }else {
    var h__2247__auto____7743 = cljs.core.hash_coll.call(null, coll);
    this__7741.__hash = h__2247__auto____7743;
    return h__2247__auto____7743
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7744 = this;
  if(this__7744.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7744.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7745 = this;
  return new cljs.core.Cons(null, o, coll, this__7745.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7746 = this;
  var this__7747 = this;
  return cljs.core.pr_str.call(null, this__7747)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7748 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7749 = this;
  return this__7749.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7750 = this;
  if(this__7750.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7750.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7751 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7752 = this;
  return new cljs.core.Cons(meta, this__7752.first, this__7752.rest, this__7752.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7753 = this;
  return this__7753.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7754 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7754.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7759 = coll == null;
    if(or__3824__auto____7759) {
      return or__3824__auto____7759
    }else {
      var G__7760__7761 = coll;
      if(G__7760__7761) {
        if(function() {
          var or__3824__auto____7762 = G__7760__7761.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7762) {
            return or__3824__auto____7762
          }else {
            return G__7760__7761.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7760__7761.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7760__7761)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7760__7761)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7766__7767 = x;
  if(G__7766__7767) {
    if(function() {
      var or__3824__auto____7768 = G__7766__7767.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7768) {
        return or__3824__auto____7768
      }else {
        return G__7766__7767.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7766__7767.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7766__7767)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7766__7767)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7769 = null;
  var G__7769__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7769__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7769 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7769__2.call(this, string, f);
      case 3:
        return G__7769__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7769
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7770 = null;
  var G__7770__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7770__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7770 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7770__2.call(this, string, k);
      case 3:
        return G__7770__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7770
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7771 = null;
  var G__7771__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7771__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7771 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7771__2.call(this, string, n);
      case 3:
        return G__7771__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7771
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7783 = null;
  var G__7783__2 = function(this_sym7774, coll) {
    var this__7776 = this;
    var this_sym7774__7777 = this;
    var ___7778 = this_sym7774__7777;
    if(coll == null) {
      return null
    }else {
      var strobj__7779 = coll.strobj;
      if(strobj__7779 == null) {
        return cljs.core._lookup.call(null, coll, this__7776.k, null)
      }else {
        return strobj__7779[this__7776.k]
      }
    }
  };
  var G__7783__3 = function(this_sym7775, coll, not_found) {
    var this__7776 = this;
    var this_sym7775__7780 = this;
    var ___7781 = this_sym7775__7780;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7776.k, not_found)
    }
  };
  G__7783 = function(this_sym7775, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7783__2.call(this, this_sym7775, coll);
      case 3:
        return G__7783__3.call(this, this_sym7775, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7783
}();
cljs.core.Keyword.prototype.apply = function(this_sym7772, args7773) {
  var this__7782 = this;
  return this_sym7772.call.apply(this_sym7772, [this_sym7772].concat(args7773.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7792 = null;
  var G__7792__2 = function(this_sym7786, coll) {
    var this_sym7786__7788 = this;
    var this__7789 = this_sym7786__7788;
    return cljs.core._lookup.call(null, coll, this__7789.toString(), null)
  };
  var G__7792__3 = function(this_sym7787, coll, not_found) {
    var this_sym7787__7790 = this;
    var this__7791 = this_sym7787__7790;
    return cljs.core._lookup.call(null, coll, this__7791.toString(), not_found)
  };
  G__7792 = function(this_sym7787, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7792__2.call(this, this_sym7787, coll);
      case 3:
        return G__7792__3.call(this, this_sym7787, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7792
}();
String.prototype.apply = function(this_sym7784, args7785) {
  return this_sym7784.call.apply(this_sym7784, [this_sym7784].concat(args7785.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7794 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7794
  }else {
    lazy_seq.x = x__7794.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7795 = this;
  var h__2247__auto____7796 = this__7795.__hash;
  if(!(h__2247__auto____7796 == null)) {
    return h__2247__auto____7796
  }else {
    var h__2247__auto____7797 = cljs.core.hash_coll.call(null, coll);
    this__7795.__hash = h__2247__auto____7797;
    return h__2247__auto____7797
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7798 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7799 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7800 = this;
  var this__7801 = this;
  return cljs.core.pr_str.call(null, this__7801)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7802 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7803 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7804 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7805 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7806 = this;
  return new cljs.core.LazySeq(meta, this__7806.realized, this__7806.x, this__7806.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7807 = this;
  return this__7807.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7808 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7808.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7809 = this;
  return this__7809.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7810 = this;
  var ___7811 = this;
  this__7810.buf[this__7810.end] = o;
  return this__7810.end = this__7810.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7812 = this;
  var ___7813 = this;
  var ret__7814 = new cljs.core.ArrayChunk(this__7812.buf, 0, this__7812.end);
  this__7812.buf = null;
  return ret__7814
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7815 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7815.arr[this__7815.off], this__7815.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7816 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7816.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7817 = this;
  if(this__7817.off === this__7817.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7817.arr, this__7817.off + 1, this__7817.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7818 = this;
  return this__7818.arr[this__7818.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7819 = this;
  if(function() {
    var and__3822__auto____7820 = i >= 0;
    if(and__3822__auto____7820) {
      return i < this__7819.end - this__7819.off
    }else {
      return and__3822__auto____7820
    }
  }()) {
    return this__7819.arr[this__7819.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7821 = this;
  return this__7821.end - this__7821.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7822 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7823 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7824 = this;
  return cljs.core._nth.call(null, this__7824.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7825 = this;
  if(cljs.core._count.call(null, this__7825.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7825.chunk), this__7825.more, this__7825.meta)
  }else {
    if(this__7825.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7825.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7826 = this;
  if(this__7826.more == null) {
    return null
  }else {
    return this__7826.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7827 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7828 = this;
  return new cljs.core.ChunkedCons(this__7828.chunk, this__7828.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7829 = this;
  return this__7829.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7830 = this;
  return this__7830.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7831 = this;
  if(this__7831.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7831.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__7835__7836 = s;
    if(G__7835__7836) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7837 = null;
        if(cljs.core.truth_(or__3824__auto____7837)) {
          return or__3824__auto____7837
        }else {
          return G__7835__7836.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7835__7836.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7835__7836)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7835__7836)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7840 = [];
  var s__7841 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7841)) {
      ary__7840.push(cljs.core.first.call(null, s__7841));
      var G__7842 = cljs.core.next.call(null, s__7841);
      s__7841 = G__7842;
      continue
    }else {
      return ary__7840
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7846 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7847 = 0;
  var xs__7848 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7848) {
      ret__7846[i__7847] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7848));
      var G__7849 = i__7847 + 1;
      var G__7850 = cljs.core.next.call(null, xs__7848);
      i__7847 = G__7849;
      xs__7848 = G__7850;
      continue
    }else {
    }
    break
  }
  return ret__7846
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__7858 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7859 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7860 = 0;
      var s__7861 = s__7859;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7862 = s__7861;
          if(and__3822__auto____7862) {
            return i__7860 < size
          }else {
            return and__3822__auto____7862
          }
        }())) {
          a__7858[i__7860] = cljs.core.first.call(null, s__7861);
          var G__7865 = i__7860 + 1;
          var G__7866 = cljs.core.next.call(null, s__7861);
          i__7860 = G__7865;
          s__7861 = G__7866;
          continue
        }else {
          return a__7858
        }
        break
      }
    }else {
      var n__2582__auto____7863 = size;
      var i__7864 = 0;
      while(true) {
        if(i__7864 < n__2582__auto____7863) {
          a__7858[i__7864] = init_val_or_seq;
          var G__7867 = i__7864 + 1;
          i__7864 = G__7867;
          continue
        }else {
        }
        break
      }
      return a__7858
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__7875 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7876 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7877 = 0;
      var s__7878 = s__7876;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7879 = s__7878;
          if(and__3822__auto____7879) {
            return i__7877 < size
          }else {
            return and__3822__auto____7879
          }
        }())) {
          a__7875[i__7877] = cljs.core.first.call(null, s__7878);
          var G__7882 = i__7877 + 1;
          var G__7883 = cljs.core.next.call(null, s__7878);
          i__7877 = G__7882;
          s__7878 = G__7883;
          continue
        }else {
          return a__7875
        }
        break
      }
    }else {
      var n__2582__auto____7880 = size;
      var i__7881 = 0;
      while(true) {
        if(i__7881 < n__2582__auto____7880) {
          a__7875[i__7881] = init_val_or_seq;
          var G__7884 = i__7881 + 1;
          i__7881 = G__7884;
          continue
        }else {
        }
        break
      }
      return a__7875
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__7892 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7893 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7894 = 0;
      var s__7895 = s__7893;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7896 = s__7895;
          if(and__3822__auto____7896) {
            return i__7894 < size
          }else {
            return and__3822__auto____7896
          }
        }())) {
          a__7892[i__7894] = cljs.core.first.call(null, s__7895);
          var G__7899 = i__7894 + 1;
          var G__7900 = cljs.core.next.call(null, s__7895);
          i__7894 = G__7899;
          s__7895 = G__7900;
          continue
        }else {
          return a__7892
        }
        break
      }
    }else {
      var n__2582__auto____7897 = size;
      var i__7898 = 0;
      while(true) {
        if(i__7898 < n__2582__auto____7897) {
          a__7892[i__7898] = init_val_or_seq;
          var G__7901 = i__7898 + 1;
          i__7898 = G__7901;
          continue
        }else {
        }
        break
      }
      return a__7892
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__7906 = s;
    var i__7907 = n;
    var sum__7908 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7909 = i__7907 > 0;
        if(and__3822__auto____7909) {
          return cljs.core.seq.call(null, s__7906)
        }else {
          return and__3822__auto____7909
        }
      }())) {
        var G__7910 = cljs.core.next.call(null, s__7906);
        var G__7911 = i__7907 - 1;
        var G__7912 = sum__7908 + 1;
        s__7906 = G__7910;
        i__7907 = G__7911;
        sum__7908 = G__7912;
        continue
      }else {
        return sum__7908
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__7917 = cljs.core.seq.call(null, x);
      if(s__7917) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7917)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7917), concat.call(null, cljs.core.chunk_rest.call(null, s__7917), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7917), concat.call(null, cljs.core.rest.call(null, s__7917), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7921__delegate = function(x, y, zs) {
      var cat__7920 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7919 = cljs.core.seq.call(null, xys);
          if(xys__7919) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7919)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7919), cat.call(null, cljs.core.chunk_rest.call(null, xys__7919), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7919), cat.call(null, cljs.core.rest.call(null, xys__7919), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__7920.call(null, concat.call(null, x, y), zs)
    };
    var G__7921 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7921__delegate.call(this, x, y, zs)
    };
    G__7921.cljs$lang$maxFixedArity = 2;
    G__7921.cljs$lang$applyTo = function(arglist__7922) {
      var x = cljs.core.first(arglist__7922);
      var y = cljs.core.first(cljs.core.next(arglist__7922));
      var zs = cljs.core.rest(cljs.core.next(arglist__7922));
      return G__7921__delegate(x, y, zs)
    };
    G__7921.cljs$lang$arity$variadic = G__7921__delegate;
    return G__7921
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__7923__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7923 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7923__delegate.call(this, a, b, c, d, more)
    };
    G__7923.cljs$lang$maxFixedArity = 4;
    G__7923.cljs$lang$applyTo = function(arglist__7924) {
      var a = cljs.core.first(arglist__7924);
      var b = cljs.core.first(cljs.core.next(arglist__7924));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7924)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7924))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7924))));
      return G__7923__delegate(a, b, c, d, more)
    };
    G__7923.cljs$lang$arity$variadic = G__7923__delegate;
    return G__7923
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7966 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7967 = cljs.core._first.call(null, args__7966);
    var args__7968 = cljs.core._rest.call(null, args__7966);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7967)
      }else {
        return f.call(null, a__7967)
      }
    }else {
      var b__7969 = cljs.core._first.call(null, args__7968);
      var args__7970 = cljs.core._rest.call(null, args__7968);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7967, b__7969)
        }else {
          return f.call(null, a__7967, b__7969)
        }
      }else {
        var c__7971 = cljs.core._first.call(null, args__7970);
        var args__7972 = cljs.core._rest.call(null, args__7970);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7967, b__7969, c__7971)
          }else {
            return f.call(null, a__7967, b__7969, c__7971)
          }
        }else {
          var d__7973 = cljs.core._first.call(null, args__7972);
          var args__7974 = cljs.core._rest.call(null, args__7972);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7967, b__7969, c__7971, d__7973)
            }else {
              return f.call(null, a__7967, b__7969, c__7971, d__7973)
            }
          }else {
            var e__7975 = cljs.core._first.call(null, args__7974);
            var args__7976 = cljs.core._rest.call(null, args__7974);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7967, b__7969, c__7971, d__7973, e__7975)
              }else {
                return f.call(null, a__7967, b__7969, c__7971, d__7973, e__7975)
              }
            }else {
              var f__7977 = cljs.core._first.call(null, args__7976);
              var args__7978 = cljs.core._rest.call(null, args__7976);
              if(argc === 6) {
                if(f__7977.cljs$lang$arity$6) {
                  return f__7977.cljs$lang$arity$6(a__7967, b__7969, c__7971, d__7973, e__7975, f__7977)
                }else {
                  return f__7977.call(null, a__7967, b__7969, c__7971, d__7973, e__7975, f__7977)
                }
              }else {
                var g__7979 = cljs.core._first.call(null, args__7978);
                var args__7980 = cljs.core._rest.call(null, args__7978);
                if(argc === 7) {
                  if(f__7977.cljs$lang$arity$7) {
                    return f__7977.cljs$lang$arity$7(a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979)
                  }else {
                    return f__7977.call(null, a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979)
                  }
                }else {
                  var h__7981 = cljs.core._first.call(null, args__7980);
                  var args__7982 = cljs.core._rest.call(null, args__7980);
                  if(argc === 8) {
                    if(f__7977.cljs$lang$arity$8) {
                      return f__7977.cljs$lang$arity$8(a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981)
                    }else {
                      return f__7977.call(null, a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981)
                    }
                  }else {
                    var i__7983 = cljs.core._first.call(null, args__7982);
                    var args__7984 = cljs.core._rest.call(null, args__7982);
                    if(argc === 9) {
                      if(f__7977.cljs$lang$arity$9) {
                        return f__7977.cljs$lang$arity$9(a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983)
                      }else {
                        return f__7977.call(null, a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983)
                      }
                    }else {
                      var j__7985 = cljs.core._first.call(null, args__7984);
                      var args__7986 = cljs.core._rest.call(null, args__7984);
                      if(argc === 10) {
                        if(f__7977.cljs$lang$arity$10) {
                          return f__7977.cljs$lang$arity$10(a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985)
                        }else {
                          return f__7977.call(null, a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985)
                        }
                      }else {
                        var k__7987 = cljs.core._first.call(null, args__7986);
                        var args__7988 = cljs.core._rest.call(null, args__7986);
                        if(argc === 11) {
                          if(f__7977.cljs$lang$arity$11) {
                            return f__7977.cljs$lang$arity$11(a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987)
                          }else {
                            return f__7977.call(null, a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987)
                          }
                        }else {
                          var l__7989 = cljs.core._first.call(null, args__7988);
                          var args__7990 = cljs.core._rest.call(null, args__7988);
                          if(argc === 12) {
                            if(f__7977.cljs$lang$arity$12) {
                              return f__7977.cljs$lang$arity$12(a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987, l__7989)
                            }else {
                              return f__7977.call(null, a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987, l__7989)
                            }
                          }else {
                            var m__7991 = cljs.core._first.call(null, args__7990);
                            var args__7992 = cljs.core._rest.call(null, args__7990);
                            if(argc === 13) {
                              if(f__7977.cljs$lang$arity$13) {
                                return f__7977.cljs$lang$arity$13(a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987, l__7989, m__7991)
                              }else {
                                return f__7977.call(null, a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987, l__7989, m__7991)
                              }
                            }else {
                              var n__7993 = cljs.core._first.call(null, args__7992);
                              var args__7994 = cljs.core._rest.call(null, args__7992);
                              if(argc === 14) {
                                if(f__7977.cljs$lang$arity$14) {
                                  return f__7977.cljs$lang$arity$14(a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987, l__7989, m__7991, n__7993)
                                }else {
                                  return f__7977.call(null, a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987, l__7989, m__7991, n__7993)
                                }
                              }else {
                                var o__7995 = cljs.core._first.call(null, args__7994);
                                var args__7996 = cljs.core._rest.call(null, args__7994);
                                if(argc === 15) {
                                  if(f__7977.cljs$lang$arity$15) {
                                    return f__7977.cljs$lang$arity$15(a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987, l__7989, m__7991, n__7993, o__7995)
                                  }else {
                                    return f__7977.call(null, a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987, l__7989, m__7991, n__7993, o__7995)
                                  }
                                }else {
                                  var p__7997 = cljs.core._first.call(null, args__7996);
                                  var args__7998 = cljs.core._rest.call(null, args__7996);
                                  if(argc === 16) {
                                    if(f__7977.cljs$lang$arity$16) {
                                      return f__7977.cljs$lang$arity$16(a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987, l__7989, m__7991, n__7993, o__7995, p__7997)
                                    }else {
                                      return f__7977.call(null, a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987, l__7989, m__7991, n__7993, o__7995, p__7997)
                                    }
                                  }else {
                                    var q__7999 = cljs.core._first.call(null, args__7998);
                                    var args__8000 = cljs.core._rest.call(null, args__7998);
                                    if(argc === 17) {
                                      if(f__7977.cljs$lang$arity$17) {
                                        return f__7977.cljs$lang$arity$17(a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987, l__7989, m__7991, n__7993, o__7995, p__7997, q__7999)
                                      }else {
                                        return f__7977.call(null, a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987, l__7989, m__7991, n__7993, o__7995, p__7997, q__7999)
                                      }
                                    }else {
                                      var r__8001 = cljs.core._first.call(null, args__8000);
                                      var args__8002 = cljs.core._rest.call(null, args__8000);
                                      if(argc === 18) {
                                        if(f__7977.cljs$lang$arity$18) {
                                          return f__7977.cljs$lang$arity$18(a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987, l__7989, m__7991, n__7993, o__7995, p__7997, q__7999, r__8001)
                                        }else {
                                          return f__7977.call(null, a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987, l__7989, m__7991, n__7993, o__7995, p__7997, q__7999, r__8001)
                                        }
                                      }else {
                                        var s__8003 = cljs.core._first.call(null, args__8002);
                                        var args__8004 = cljs.core._rest.call(null, args__8002);
                                        if(argc === 19) {
                                          if(f__7977.cljs$lang$arity$19) {
                                            return f__7977.cljs$lang$arity$19(a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987, l__7989, m__7991, n__7993, o__7995, p__7997, q__7999, r__8001, s__8003)
                                          }else {
                                            return f__7977.call(null, a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987, l__7989, m__7991, n__7993, o__7995, p__7997, q__7999, r__8001, s__8003)
                                          }
                                        }else {
                                          var t__8005 = cljs.core._first.call(null, args__8004);
                                          var args__8006 = cljs.core._rest.call(null, args__8004);
                                          if(argc === 20) {
                                            if(f__7977.cljs$lang$arity$20) {
                                              return f__7977.cljs$lang$arity$20(a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987, l__7989, m__7991, n__7993, o__7995, p__7997, q__7999, r__8001, s__8003, t__8005)
                                            }else {
                                              return f__7977.call(null, a__7967, b__7969, c__7971, d__7973, e__7975, f__7977, g__7979, h__7981, i__7983, j__7985, k__7987, l__7989, m__7991, n__7993, o__7995, p__7997, q__7999, r__8001, s__8003, t__8005)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__8021 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8022 = cljs.core.bounded_count.call(null, args, fixed_arity__8021 + 1);
      if(bc__8022 <= fixed_arity__8021) {
        return cljs.core.apply_to.call(null, f, bc__8022, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__8023 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__8024 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8025 = cljs.core.bounded_count.call(null, arglist__8023, fixed_arity__8024 + 1);
      if(bc__8025 <= fixed_arity__8024) {
        return cljs.core.apply_to.call(null, f, bc__8025, arglist__8023)
      }else {
        return f.cljs$lang$applyTo(arglist__8023)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8023))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__8026 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__8027 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8028 = cljs.core.bounded_count.call(null, arglist__8026, fixed_arity__8027 + 1);
      if(bc__8028 <= fixed_arity__8027) {
        return cljs.core.apply_to.call(null, f, bc__8028, arglist__8026)
      }else {
        return f.cljs$lang$applyTo(arglist__8026)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8026))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__8029 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__8030 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__8031 = cljs.core.bounded_count.call(null, arglist__8029, fixed_arity__8030 + 1);
      if(bc__8031 <= fixed_arity__8030) {
        return cljs.core.apply_to.call(null, f, bc__8031, arglist__8029)
      }else {
        return f.cljs$lang$applyTo(arglist__8029)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__8029))
    }
  };
  var apply__6 = function() {
    var G__8035__delegate = function(f, a, b, c, d, args) {
      var arglist__8032 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__8033 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__8034 = cljs.core.bounded_count.call(null, arglist__8032, fixed_arity__8033 + 1);
        if(bc__8034 <= fixed_arity__8033) {
          return cljs.core.apply_to.call(null, f, bc__8034, arglist__8032)
        }else {
          return f.cljs$lang$applyTo(arglist__8032)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__8032))
      }
    };
    var G__8035 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__8035__delegate.call(this, f, a, b, c, d, args)
    };
    G__8035.cljs$lang$maxFixedArity = 5;
    G__8035.cljs$lang$applyTo = function(arglist__8036) {
      var f = cljs.core.first(arglist__8036);
      var a = cljs.core.first(cljs.core.next(arglist__8036));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8036)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8036))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8036)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8036)))));
      return G__8035__delegate(f, a, b, c, d, args)
    };
    G__8035.cljs$lang$arity$variadic = G__8035__delegate;
    return G__8035
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__8037) {
    var obj = cljs.core.first(arglist__8037);
    var f = cljs.core.first(cljs.core.next(arglist__8037));
    var args = cljs.core.rest(cljs.core.next(arglist__8037));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__8038__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__8038 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8038__delegate.call(this, x, y, more)
    };
    G__8038.cljs$lang$maxFixedArity = 2;
    G__8038.cljs$lang$applyTo = function(arglist__8039) {
      var x = cljs.core.first(arglist__8039);
      var y = cljs.core.first(cljs.core.next(arglist__8039));
      var more = cljs.core.rest(cljs.core.next(arglist__8039));
      return G__8038__delegate(x, y, more)
    };
    G__8038.cljs$lang$arity$variadic = G__8038__delegate;
    return G__8038
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__8040 = pred;
        var G__8041 = cljs.core.next.call(null, coll);
        pred = G__8040;
        coll = G__8041;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____8043 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____8043)) {
        return or__3824__auto____8043
      }else {
        var G__8044 = pred;
        var G__8045 = cljs.core.next.call(null, coll);
        pred = G__8044;
        coll = G__8045;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__8046 = null;
    var G__8046__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__8046__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__8046__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__8046__3 = function() {
      var G__8047__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__8047 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__8047__delegate.call(this, x, y, zs)
      };
      G__8047.cljs$lang$maxFixedArity = 2;
      G__8047.cljs$lang$applyTo = function(arglist__8048) {
        var x = cljs.core.first(arglist__8048);
        var y = cljs.core.first(cljs.core.next(arglist__8048));
        var zs = cljs.core.rest(cljs.core.next(arglist__8048));
        return G__8047__delegate(x, y, zs)
      };
      G__8047.cljs$lang$arity$variadic = G__8047__delegate;
      return G__8047
    }();
    G__8046 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__8046__0.call(this);
        case 1:
          return G__8046__1.call(this, x);
        case 2:
          return G__8046__2.call(this, x, y);
        default:
          return G__8046__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__8046.cljs$lang$maxFixedArity = 2;
    G__8046.cljs$lang$applyTo = G__8046__3.cljs$lang$applyTo;
    return G__8046
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__8049__delegate = function(args) {
      return x
    };
    var G__8049 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__8049__delegate.call(this, args)
    };
    G__8049.cljs$lang$maxFixedArity = 0;
    G__8049.cljs$lang$applyTo = function(arglist__8050) {
      var args = cljs.core.seq(arglist__8050);
      return G__8049__delegate(args)
    };
    G__8049.cljs$lang$arity$variadic = G__8049__delegate;
    return G__8049
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__8057 = null;
      var G__8057__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__8057__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__8057__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__8057__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__8057__4 = function() {
        var G__8058__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__8058 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8058__delegate.call(this, x, y, z, args)
        };
        G__8058.cljs$lang$maxFixedArity = 3;
        G__8058.cljs$lang$applyTo = function(arglist__8059) {
          var x = cljs.core.first(arglist__8059);
          var y = cljs.core.first(cljs.core.next(arglist__8059));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8059)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8059)));
          return G__8058__delegate(x, y, z, args)
        };
        G__8058.cljs$lang$arity$variadic = G__8058__delegate;
        return G__8058
      }();
      G__8057 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8057__0.call(this);
          case 1:
            return G__8057__1.call(this, x);
          case 2:
            return G__8057__2.call(this, x, y);
          case 3:
            return G__8057__3.call(this, x, y, z);
          default:
            return G__8057__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8057.cljs$lang$maxFixedArity = 3;
      G__8057.cljs$lang$applyTo = G__8057__4.cljs$lang$applyTo;
      return G__8057
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__8060 = null;
      var G__8060__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__8060__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__8060__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__8060__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__8060__4 = function() {
        var G__8061__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__8061 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8061__delegate.call(this, x, y, z, args)
        };
        G__8061.cljs$lang$maxFixedArity = 3;
        G__8061.cljs$lang$applyTo = function(arglist__8062) {
          var x = cljs.core.first(arglist__8062);
          var y = cljs.core.first(cljs.core.next(arglist__8062));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8062)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8062)));
          return G__8061__delegate(x, y, z, args)
        };
        G__8061.cljs$lang$arity$variadic = G__8061__delegate;
        return G__8061
      }();
      G__8060 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8060__0.call(this);
          case 1:
            return G__8060__1.call(this, x);
          case 2:
            return G__8060__2.call(this, x, y);
          case 3:
            return G__8060__3.call(this, x, y, z);
          default:
            return G__8060__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8060.cljs$lang$maxFixedArity = 3;
      G__8060.cljs$lang$applyTo = G__8060__4.cljs$lang$applyTo;
      return G__8060
    }()
  };
  var comp__4 = function() {
    var G__8063__delegate = function(f1, f2, f3, fs) {
      var fs__8054 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__8064__delegate = function(args) {
          var ret__8055 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__8054), args);
          var fs__8056 = cljs.core.next.call(null, fs__8054);
          while(true) {
            if(fs__8056) {
              var G__8065 = cljs.core.first.call(null, fs__8056).call(null, ret__8055);
              var G__8066 = cljs.core.next.call(null, fs__8056);
              ret__8055 = G__8065;
              fs__8056 = G__8066;
              continue
            }else {
              return ret__8055
            }
            break
          }
        };
        var G__8064 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__8064__delegate.call(this, args)
        };
        G__8064.cljs$lang$maxFixedArity = 0;
        G__8064.cljs$lang$applyTo = function(arglist__8067) {
          var args = cljs.core.seq(arglist__8067);
          return G__8064__delegate(args)
        };
        G__8064.cljs$lang$arity$variadic = G__8064__delegate;
        return G__8064
      }()
    };
    var G__8063 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8063__delegate.call(this, f1, f2, f3, fs)
    };
    G__8063.cljs$lang$maxFixedArity = 3;
    G__8063.cljs$lang$applyTo = function(arglist__8068) {
      var f1 = cljs.core.first(arglist__8068);
      var f2 = cljs.core.first(cljs.core.next(arglist__8068));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8068)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8068)));
      return G__8063__delegate(f1, f2, f3, fs)
    };
    G__8063.cljs$lang$arity$variadic = G__8063__delegate;
    return G__8063
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__8069__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__8069 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8069__delegate.call(this, args)
      };
      G__8069.cljs$lang$maxFixedArity = 0;
      G__8069.cljs$lang$applyTo = function(arglist__8070) {
        var args = cljs.core.seq(arglist__8070);
        return G__8069__delegate(args)
      };
      G__8069.cljs$lang$arity$variadic = G__8069__delegate;
      return G__8069
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__8071__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__8071 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8071__delegate.call(this, args)
      };
      G__8071.cljs$lang$maxFixedArity = 0;
      G__8071.cljs$lang$applyTo = function(arglist__8072) {
        var args = cljs.core.seq(arglist__8072);
        return G__8071__delegate(args)
      };
      G__8071.cljs$lang$arity$variadic = G__8071__delegate;
      return G__8071
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__8073__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__8073 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__8073__delegate.call(this, args)
      };
      G__8073.cljs$lang$maxFixedArity = 0;
      G__8073.cljs$lang$applyTo = function(arglist__8074) {
        var args = cljs.core.seq(arglist__8074);
        return G__8073__delegate(args)
      };
      G__8073.cljs$lang$arity$variadic = G__8073__delegate;
      return G__8073
    }()
  };
  var partial__5 = function() {
    var G__8075__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__8076__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__8076 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__8076__delegate.call(this, args)
        };
        G__8076.cljs$lang$maxFixedArity = 0;
        G__8076.cljs$lang$applyTo = function(arglist__8077) {
          var args = cljs.core.seq(arglist__8077);
          return G__8076__delegate(args)
        };
        G__8076.cljs$lang$arity$variadic = G__8076__delegate;
        return G__8076
      }()
    };
    var G__8075 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8075__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__8075.cljs$lang$maxFixedArity = 4;
    G__8075.cljs$lang$applyTo = function(arglist__8078) {
      var f = cljs.core.first(arglist__8078);
      var arg1 = cljs.core.first(cljs.core.next(arglist__8078));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8078)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8078))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8078))));
      return G__8075__delegate(f, arg1, arg2, arg3, more)
    };
    G__8075.cljs$lang$arity$variadic = G__8075__delegate;
    return G__8075
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__8079 = null;
      var G__8079__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__8079__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__8079__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__8079__4 = function() {
        var G__8080__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__8080 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8080__delegate.call(this, a, b, c, ds)
        };
        G__8080.cljs$lang$maxFixedArity = 3;
        G__8080.cljs$lang$applyTo = function(arglist__8081) {
          var a = cljs.core.first(arglist__8081);
          var b = cljs.core.first(cljs.core.next(arglist__8081));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8081)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8081)));
          return G__8080__delegate(a, b, c, ds)
        };
        G__8080.cljs$lang$arity$variadic = G__8080__delegate;
        return G__8080
      }();
      G__8079 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__8079__1.call(this, a);
          case 2:
            return G__8079__2.call(this, a, b);
          case 3:
            return G__8079__3.call(this, a, b, c);
          default:
            return G__8079__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8079.cljs$lang$maxFixedArity = 3;
      G__8079.cljs$lang$applyTo = G__8079__4.cljs$lang$applyTo;
      return G__8079
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__8082 = null;
      var G__8082__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__8082__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__8082__4 = function() {
        var G__8083__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__8083 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8083__delegate.call(this, a, b, c, ds)
        };
        G__8083.cljs$lang$maxFixedArity = 3;
        G__8083.cljs$lang$applyTo = function(arglist__8084) {
          var a = cljs.core.first(arglist__8084);
          var b = cljs.core.first(cljs.core.next(arglist__8084));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8084)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8084)));
          return G__8083__delegate(a, b, c, ds)
        };
        G__8083.cljs$lang$arity$variadic = G__8083__delegate;
        return G__8083
      }();
      G__8082 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__8082__2.call(this, a, b);
          case 3:
            return G__8082__3.call(this, a, b, c);
          default:
            return G__8082__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8082.cljs$lang$maxFixedArity = 3;
      G__8082.cljs$lang$applyTo = G__8082__4.cljs$lang$applyTo;
      return G__8082
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__8085 = null;
      var G__8085__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__8085__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__8085__4 = function() {
        var G__8086__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__8086 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8086__delegate.call(this, a, b, c, ds)
        };
        G__8086.cljs$lang$maxFixedArity = 3;
        G__8086.cljs$lang$applyTo = function(arglist__8087) {
          var a = cljs.core.first(arglist__8087);
          var b = cljs.core.first(cljs.core.next(arglist__8087));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8087)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8087)));
          return G__8086__delegate(a, b, c, ds)
        };
        G__8086.cljs$lang$arity$variadic = G__8086__delegate;
        return G__8086
      }();
      G__8085 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__8085__2.call(this, a, b);
          case 3:
            return G__8085__3.call(this, a, b, c);
          default:
            return G__8085__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8085.cljs$lang$maxFixedArity = 3;
      G__8085.cljs$lang$applyTo = G__8085__4.cljs$lang$applyTo;
      return G__8085
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__8103 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8111 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8111) {
        var s__8112 = temp__3974__auto____8111;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8112)) {
          var c__8113 = cljs.core.chunk_first.call(null, s__8112);
          var size__8114 = cljs.core.count.call(null, c__8113);
          var b__8115 = cljs.core.chunk_buffer.call(null, size__8114);
          var n__2582__auto____8116 = size__8114;
          var i__8117 = 0;
          while(true) {
            if(i__8117 < n__2582__auto____8116) {
              cljs.core.chunk_append.call(null, b__8115, f.call(null, idx + i__8117, cljs.core._nth.call(null, c__8113, i__8117)));
              var G__8118 = i__8117 + 1;
              i__8117 = G__8118;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8115), mapi.call(null, idx + size__8114, cljs.core.chunk_rest.call(null, s__8112)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__8112)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__8112)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__8103.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8128 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8128) {
      var s__8129 = temp__3974__auto____8128;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8129)) {
        var c__8130 = cljs.core.chunk_first.call(null, s__8129);
        var size__8131 = cljs.core.count.call(null, c__8130);
        var b__8132 = cljs.core.chunk_buffer.call(null, size__8131);
        var n__2582__auto____8133 = size__8131;
        var i__8134 = 0;
        while(true) {
          if(i__8134 < n__2582__auto____8133) {
            var x__8135 = f.call(null, cljs.core._nth.call(null, c__8130, i__8134));
            if(x__8135 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__8132, x__8135)
            }
            var G__8137 = i__8134 + 1;
            i__8134 = G__8137;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8132), keep.call(null, f, cljs.core.chunk_rest.call(null, s__8129)))
      }else {
        var x__8136 = f.call(null, cljs.core.first.call(null, s__8129));
        if(x__8136 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__8129))
        }else {
          return cljs.core.cons.call(null, x__8136, keep.call(null, f, cljs.core.rest.call(null, s__8129)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__8163 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8173 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8173) {
        var s__8174 = temp__3974__auto____8173;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8174)) {
          var c__8175 = cljs.core.chunk_first.call(null, s__8174);
          var size__8176 = cljs.core.count.call(null, c__8175);
          var b__8177 = cljs.core.chunk_buffer.call(null, size__8176);
          var n__2582__auto____8178 = size__8176;
          var i__8179 = 0;
          while(true) {
            if(i__8179 < n__2582__auto____8178) {
              var x__8180 = f.call(null, idx + i__8179, cljs.core._nth.call(null, c__8175, i__8179));
              if(x__8180 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__8177, x__8180)
              }
              var G__8182 = i__8179 + 1;
              i__8179 = G__8182;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8177), keepi.call(null, idx + size__8176, cljs.core.chunk_rest.call(null, s__8174)))
        }else {
          var x__8181 = f.call(null, idx, cljs.core.first.call(null, s__8174));
          if(x__8181 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8174))
          }else {
            return cljs.core.cons.call(null, x__8181, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8174)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__8163.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8268 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8268)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____8268
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8269 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8269)) {
            var and__3822__auto____8270 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8270)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____8270
            }
          }else {
            return and__3822__auto____8269
          }
        }())
      };
      var ep1__4 = function() {
        var G__8339__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8271 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8271)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____8271
            }
          }())
        };
        var G__8339 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8339__delegate.call(this, x, y, z, args)
        };
        G__8339.cljs$lang$maxFixedArity = 3;
        G__8339.cljs$lang$applyTo = function(arglist__8340) {
          var x = cljs.core.first(arglist__8340);
          var y = cljs.core.first(cljs.core.next(arglist__8340));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8340)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8340)));
          return G__8339__delegate(x, y, z, args)
        };
        G__8339.cljs$lang$arity$variadic = G__8339__delegate;
        return G__8339
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8283 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8283)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____8283
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8284 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8284)) {
            var and__3822__auto____8285 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8285)) {
              var and__3822__auto____8286 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8286)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____8286
              }
            }else {
              return and__3822__auto____8285
            }
          }else {
            return and__3822__auto____8284
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8287 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8287)) {
            var and__3822__auto____8288 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8288)) {
              var and__3822__auto____8289 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____8289)) {
                var and__3822__auto____8290 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____8290)) {
                  var and__3822__auto____8291 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8291)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____8291
                  }
                }else {
                  return and__3822__auto____8290
                }
              }else {
                return and__3822__auto____8289
              }
            }else {
              return and__3822__auto____8288
            }
          }else {
            return and__3822__auto____8287
          }
        }())
      };
      var ep2__4 = function() {
        var G__8341__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8292 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8292)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8138_SHARP_) {
                var and__3822__auto____8293 = p1.call(null, p1__8138_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8293)) {
                  return p2.call(null, p1__8138_SHARP_)
                }else {
                  return and__3822__auto____8293
                }
              }, args)
            }else {
              return and__3822__auto____8292
            }
          }())
        };
        var G__8341 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8341__delegate.call(this, x, y, z, args)
        };
        G__8341.cljs$lang$maxFixedArity = 3;
        G__8341.cljs$lang$applyTo = function(arglist__8342) {
          var x = cljs.core.first(arglist__8342);
          var y = cljs.core.first(cljs.core.next(arglist__8342));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8342)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8342)));
          return G__8341__delegate(x, y, z, args)
        };
        G__8341.cljs$lang$arity$variadic = G__8341__delegate;
        return G__8341
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8312 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8312)) {
            var and__3822__auto____8313 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8313)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____8313
            }
          }else {
            return and__3822__auto____8312
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8314 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8314)) {
            var and__3822__auto____8315 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8315)) {
              var and__3822__auto____8316 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8316)) {
                var and__3822__auto____8317 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8317)) {
                  var and__3822__auto____8318 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8318)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____8318
                  }
                }else {
                  return and__3822__auto____8317
                }
              }else {
                return and__3822__auto____8316
              }
            }else {
              return and__3822__auto____8315
            }
          }else {
            return and__3822__auto____8314
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8319 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8319)) {
            var and__3822__auto____8320 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8320)) {
              var and__3822__auto____8321 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8321)) {
                var and__3822__auto____8322 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8322)) {
                  var and__3822__auto____8323 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8323)) {
                    var and__3822__auto____8324 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____8324)) {
                      var and__3822__auto____8325 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____8325)) {
                        var and__3822__auto____8326 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____8326)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____8326
                        }
                      }else {
                        return and__3822__auto____8325
                      }
                    }else {
                      return and__3822__auto____8324
                    }
                  }else {
                    return and__3822__auto____8323
                  }
                }else {
                  return and__3822__auto____8322
                }
              }else {
                return and__3822__auto____8321
              }
            }else {
              return and__3822__auto____8320
            }
          }else {
            return and__3822__auto____8319
          }
        }())
      };
      var ep3__4 = function() {
        var G__8343__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8327 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8327)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8139_SHARP_) {
                var and__3822__auto____8328 = p1.call(null, p1__8139_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8328)) {
                  var and__3822__auto____8329 = p2.call(null, p1__8139_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____8329)) {
                    return p3.call(null, p1__8139_SHARP_)
                  }else {
                    return and__3822__auto____8329
                  }
                }else {
                  return and__3822__auto____8328
                }
              }, args)
            }else {
              return and__3822__auto____8327
            }
          }())
        };
        var G__8343 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8343__delegate.call(this, x, y, z, args)
        };
        G__8343.cljs$lang$maxFixedArity = 3;
        G__8343.cljs$lang$applyTo = function(arglist__8344) {
          var x = cljs.core.first(arglist__8344);
          var y = cljs.core.first(cljs.core.next(arglist__8344));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8344)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8344)));
          return G__8343__delegate(x, y, z, args)
        };
        G__8343.cljs$lang$arity$variadic = G__8343__delegate;
        return G__8343
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__8345__delegate = function(p1, p2, p3, ps) {
      var ps__8330 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__8140_SHARP_) {
            return p1__8140_SHARP_.call(null, x)
          }, ps__8330)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__8141_SHARP_) {
            var and__3822__auto____8335 = p1__8141_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8335)) {
              return p1__8141_SHARP_.call(null, y)
            }else {
              return and__3822__auto____8335
            }
          }, ps__8330)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__8142_SHARP_) {
            var and__3822__auto____8336 = p1__8142_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8336)) {
              var and__3822__auto____8337 = p1__8142_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____8337)) {
                return p1__8142_SHARP_.call(null, z)
              }else {
                return and__3822__auto____8337
              }
            }else {
              return and__3822__auto____8336
            }
          }, ps__8330)
        };
        var epn__4 = function() {
          var G__8346__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____8338 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____8338)) {
                return cljs.core.every_QMARK_.call(null, function(p1__8143_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__8143_SHARP_, args)
                }, ps__8330)
              }else {
                return and__3822__auto____8338
              }
            }())
          };
          var G__8346 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8346__delegate.call(this, x, y, z, args)
          };
          G__8346.cljs$lang$maxFixedArity = 3;
          G__8346.cljs$lang$applyTo = function(arglist__8347) {
            var x = cljs.core.first(arglist__8347);
            var y = cljs.core.first(cljs.core.next(arglist__8347));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8347)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8347)));
            return G__8346__delegate(x, y, z, args)
          };
          G__8346.cljs$lang$arity$variadic = G__8346__delegate;
          return G__8346
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__8345 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8345__delegate.call(this, p1, p2, p3, ps)
    };
    G__8345.cljs$lang$maxFixedArity = 3;
    G__8345.cljs$lang$applyTo = function(arglist__8348) {
      var p1 = cljs.core.first(arglist__8348);
      var p2 = cljs.core.first(cljs.core.next(arglist__8348));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8348)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8348)));
      return G__8345__delegate(p1, p2, p3, ps)
    };
    G__8345.cljs$lang$arity$variadic = G__8345__delegate;
    return G__8345
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____8429 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8429)) {
          return or__3824__auto____8429
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____8430 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8430)) {
          return or__3824__auto____8430
        }else {
          var or__3824__auto____8431 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8431)) {
            return or__3824__auto____8431
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8500__delegate = function(x, y, z, args) {
          var or__3824__auto____8432 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8432)) {
            return or__3824__auto____8432
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8500 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8500__delegate.call(this, x, y, z, args)
        };
        G__8500.cljs$lang$maxFixedArity = 3;
        G__8500.cljs$lang$applyTo = function(arglist__8501) {
          var x = cljs.core.first(arglist__8501);
          var y = cljs.core.first(cljs.core.next(arglist__8501));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8501)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8501)));
          return G__8500__delegate(x, y, z, args)
        };
        G__8500.cljs$lang$arity$variadic = G__8500__delegate;
        return G__8500
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____8444 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8444)) {
          return or__3824__auto____8444
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____8445 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8445)) {
          return or__3824__auto____8445
        }else {
          var or__3824__auto____8446 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8446)) {
            return or__3824__auto____8446
          }else {
            var or__3824__auto____8447 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8447)) {
              return or__3824__auto____8447
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____8448 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8448)) {
          return or__3824__auto____8448
        }else {
          var or__3824__auto____8449 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8449)) {
            return or__3824__auto____8449
          }else {
            var or__3824__auto____8450 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____8450)) {
              return or__3824__auto____8450
            }else {
              var or__3824__auto____8451 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____8451)) {
                return or__3824__auto____8451
              }else {
                var or__3824__auto____8452 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8452)) {
                  return or__3824__auto____8452
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8502__delegate = function(x, y, z, args) {
          var or__3824__auto____8453 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8453)) {
            return or__3824__auto____8453
          }else {
            return cljs.core.some.call(null, function(p1__8183_SHARP_) {
              var or__3824__auto____8454 = p1.call(null, p1__8183_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8454)) {
                return or__3824__auto____8454
              }else {
                return p2.call(null, p1__8183_SHARP_)
              }
            }, args)
          }
        };
        var G__8502 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8502__delegate.call(this, x, y, z, args)
        };
        G__8502.cljs$lang$maxFixedArity = 3;
        G__8502.cljs$lang$applyTo = function(arglist__8503) {
          var x = cljs.core.first(arglist__8503);
          var y = cljs.core.first(cljs.core.next(arglist__8503));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8503)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8503)));
          return G__8502__delegate(x, y, z, args)
        };
        G__8502.cljs$lang$arity$variadic = G__8502__delegate;
        return G__8502
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____8473 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8473)) {
          return or__3824__auto____8473
        }else {
          var or__3824__auto____8474 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8474)) {
            return or__3824__auto____8474
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____8475 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8475)) {
          return or__3824__auto____8475
        }else {
          var or__3824__auto____8476 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8476)) {
            return or__3824__auto____8476
          }else {
            var or__3824__auto____8477 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8477)) {
              return or__3824__auto____8477
            }else {
              var or__3824__auto____8478 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8478)) {
                return or__3824__auto____8478
              }else {
                var or__3824__auto____8479 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8479)) {
                  return or__3824__auto____8479
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____8480 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8480)) {
          return or__3824__auto____8480
        }else {
          var or__3824__auto____8481 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8481)) {
            return or__3824__auto____8481
          }else {
            var or__3824__auto____8482 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8482)) {
              return or__3824__auto____8482
            }else {
              var or__3824__auto____8483 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8483)) {
                return or__3824__auto____8483
              }else {
                var or__3824__auto____8484 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8484)) {
                  return or__3824__auto____8484
                }else {
                  var or__3824__auto____8485 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____8485)) {
                    return or__3824__auto____8485
                  }else {
                    var or__3824__auto____8486 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____8486)) {
                      return or__3824__auto____8486
                    }else {
                      var or__3824__auto____8487 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____8487)) {
                        return or__3824__auto____8487
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__8504__delegate = function(x, y, z, args) {
          var or__3824__auto____8488 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8488)) {
            return or__3824__auto____8488
          }else {
            return cljs.core.some.call(null, function(p1__8184_SHARP_) {
              var or__3824__auto____8489 = p1.call(null, p1__8184_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8489)) {
                return or__3824__auto____8489
              }else {
                var or__3824__auto____8490 = p2.call(null, p1__8184_SHARP_);
                if(cljs.core.truth_(or__3824__auto____8490)) {
                  return or__3824__auto____8490
                }else {
                  return p3.call(null, p1__8184_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8504 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8504__delegate.call(this, x, y, z, args)
        };
        G__8504.cljs$lang$maxFixedArity = 3;
        G__8504.cljs$lang$applyTo = function(arglist__8505) {
          var x = cljs.core.first(arglist__8505);
          var y = cljs.core.first(cljs.core.next(arglist__8505));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8505)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8505)));
          return G__8504__delegate(x, y, z, args)
        };
        G__8504.cljs$lang$arity$variadic = G__8504__delegate;
        return G__8504
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__8506__delegate = function(p1, p2, p3, ps) {
      var ps__8491 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__8185_SHARP_) {
            return p1__8185_SHARP_.call(null, x)
          }, ps__8491)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__8186_SHARP_) {
            var or__3824__auto____8496 = p1__8186_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8496)) {
              return or__3824__auto____8496
            }else {
              return p1__8186_SHARP_.call(null, y)
            }
          }, ps__8491)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__8187_SHARP_) {
            var or__3824__auto____8497 = p1__8187_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8497)) {
              return or__3824__auto____8497
            }else {
              var or__3824__auto____8498 = p1__8187_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8498)) {
                return or__3824__auto____8498
              }else {
                return p1__8187_SHARP_.call(null, z)
              }
            }
          }, ps__8491)
        };
        var spn__4 = function() {
          var G__8507__delegate = function(x, y, z, args) {
            var or__3824__auto____8499 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____8499)) {
              return or__3824__auto____8499
            }else {
              return cljs.core.some.call(null, function(p1__8188_SHARP_) {
                return cljs.core.some.call(null, p1__8188_SHARP_, args)
              }, ps__8491)
            }
          };
          var G__8507 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8507__delegate.call(this, x, y, z, args)
          };
          G__8507.cljs$lang$maxFixedArity = 3;
          G__8507.cljs$lang$applyTo = function(arglist__8508) {
            var x = cljs.core.first(arglist__8508);
            var y = cljs.core.first(cljs.core.next(arglist__8508));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8508)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8508)));
            return G__8507__delegate(x, y, z, args)
          };
          G__8507.cljs$lang$arity$variadic = G__8507__delegate;
          return G__8507
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__8506 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8506__delegate.call(this, p1, p2, p3, ps)
    };
    G__8506.cljs$lang$maxFixedArity = 3;
    G__8506.cljs$lang$applyTo = function(arglist__8509) {
      var p1 = cljs.core.first(arglist__8509);
      var p2 = cljs.core.first(cljs.core.next(arglist__8509));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8509)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8509)));
      return G__8506__delegate(p1, p2, p3, ps)
    };
    G__8506.cljs$lang$arity$variadic = G__8506__delegate;
    return G__8506
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8528 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8528) {
        var s__8529 = temp__3974__auto____8528;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8529)) {
          var c__8530 = cljs.core.chunk_first.call(null, s__8529);
          var size__8531 = cljs.core.count.call(null, c__8530);
          var b__8532 = cljs.core.chunk_buffer.call(null, size__8531);
          var n__2582__auto____8533 = size__8531;
          var i__8534 = 0;
          while(true) {
            if(i__8534 < n__2582__auto____8533) {
              cljs.core.chunk_append.call(null, b__8532, f.call(null, cljs.core._nth.call(null, c__8530, i__8534)));
              var G__8546 = i__8534 + 1;
              i__8534 = G__8546;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8532), map.call(null, f, cljs.core.chunk_rest.call(null, s__8529)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8529)), map.call(null, f, cljs.core.rest.call(null, s__8529)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8535 = cljs.core.seq.call(null, c1);
      var s2__8536 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8537 = s1__8535;
        if(and__3822__auto____8537) {
          return s2__8536
        }else {
          return and__3822__auto____8537
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8535), cljs.core.first.call(null, s2__8536)), map.call(null, f, cljs.core.rest.call(null, s1__8535), cljs.core.rest.call(null, s2__8536)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8538 = cljs.core.seq.call(null, c1);
      var s2__8539 = cljs.core.seq.call(null, c2);
      var s3__8540 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8541 = s1__8538;
        if(and__3822__auto____8541) {
          var and__3822__auto____8542 = s2__8539;
          if(and__3822__auto____8542) {
            return s3__8540
          }else {
            return and__3822__auto____8542
          }
        }else {
          return and__3822__auto____8541
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8538), cljs.core.first.call(null, s2__8539), cljs.core.first.call(null, s3__8540)), map.call(null, f, cljs.core.rest.call(null, s1__8538), cljs.core.rest.call(null, s2__8539), cljs.core.rest.call(null, s3__8540)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8547__delegate = function(f, c1, c2, c3, colls) {
      var step__8545 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8544 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8544)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8544), step.call(null, map.call(null, cljs.core.rest, ss__8544)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__8349_SHARP_) {
        return cljs.core.apply.call(null, f, p1__8349_SHARP_)
      }, step__8545.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8547 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8547__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8547.cljs$lang$maxFixedArity = 4;
    G__8547.cljs$lang$applyTo = function(arglist__8548) {
      var f = cljs.core.first(arglist__8548);
      var c1 = cljs.core.first(cljs.core.next(arglist__8548));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8548)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8548))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8548))));
      return G__8547__delegate(f, c1, c2, c3, colls)
    };
    G__8547.cljs$lang$arity$variadic = G__8547__delegate;
    return G__8547
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____8551 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8551) {
        var s__8552 = temp__3974__auto____8551;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8552), take.call(null, n - 1, cljs.core.rest.call(null, s__8552)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8558 = function(n, coll) {
    while(true) {
      var s__8556 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8557 = n > 0;
        if(and__3822__auto____8557) {
          return s__8556
        }else {
          return and__3822__auto____8557
        }
      }())) {
        var G__8559 = n - 1;
        var G__8560 = cljs.core.rest.call(null, s__8556);
        n = G__8559;
        coll = G__8560;
        continue
      }else {
        return s__8556
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8558.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8563 = cljs.core.seq.call(null, coll);
  var lead__8564 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8564) {
      var G__8565 = cljs.core.next.call(null, s__8563);
      var G__8566 = cljs.core.next.call(null, lead__8564);
      s__8563 = G__8565;
      lead__8564 = G__8566;
      continue
    }else {
      return s__8563
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8572 = function(pred, coll) {
    while(true) {
      var s__8570 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8571 = s__8570;
        if(and__3822__auto____8571) {
          return pred.call(null, cljs.core.first.call(null, s__8570))
        }else {
          return and__3822__auto____8571
        }
      }())) {
        var G__8573 = pred;
        var G__8574 = cljs.core.rest.call(null, s__8570);
        pred = G__8573;
        coll = G__8574;
        continue
      }else {
        return s__8570
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8572.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8577 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8577) {
      var s__8578 = temp__3974__auto____8577;
      return cljs.core.concat.call(null, s__8578, cycle.call(null, s__8578))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8583 = cljs.core.seq.call(null, c1);
      var s2__8584 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8585 = s1__8583;
        if(and__3822__auto____8585) {
          return s2__8584
        }else {
          return and__3822__auto____8585
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8583), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8584), interleave.call(null, cljs.core.rest.call(null, s1__8583), cljs.core.rest.call(null, s2__8584))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8587__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8586 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8586)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8586), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8586)))
        }else {
          return null
        }
      }, null)
    };
    var G__8587 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8587__delegate.call(this, c1, c2, colls)
    };
    G__8587.cljs$lang$maxFixedArity = 2;
    G__8587.cljs$lang$applyTo = function(arglist__8588) {
      var c1 = cljs.core.first(arglist__8588);
      var c2 = cljs.core.first(cljs.core.next(arglist__8588));
      var colls = cljs.core.rest(cljs.core.next(arglist__8588));
      return G__8587__delegate(c1, c2, colls)
    };
    G__8587.cljs$lang$arity$variadic = G__8587__delegate;
    return G__8587
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8598 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8596 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8596) {
        var coll__8597 = temp__3971__auto____8596;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8597), cat.call(null, cljs.core.rest.call(null, coll__8597), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8598.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8599__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8599 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8599__delegate.call(this, f, coll, colls)
    };
    G__8599.cljs$lang$maxFixedArity = 2;
    G__8599.cljs$lang$applyTo = function(arglist__8600) {
      var f = cljs.core.first(arglist__8600);
      var coll = cljs.core.first(cljs.core.next(arglist__8600));
      var colls = cljs.core.rest(cljs.core.next(arglist__8600));
      return G__8599__delegate(f, coll, colls)
    };
    G__8599.cljs$lang$arity$variadic = G__8599__delegate;
    return G__8599
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8610 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8610) {
      var s__8611 = temp__3974__auto____8610;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8611)) {
        var c__8612 = cljs.core.chunk_first.call(null, s__8611);
        var size__8613 = cljs.core.count.call(null, c__8612);
        var b__8614 = cljs.core.chunk_buffer.call(null, size__8613);
        var n__2582__auto____8615 = size__8613;
        var i__8616 = 0;
        while(true) {
          if(i__8616 < n__2582__auto____8615) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8612, i__8616)))) {
              cljs.core.chunk_append.call(null, b__8614, cljs.core._nth.call(null, c__8612, i__8616))
            }else {
            }
            var G__8619 = i__8616 + 1;
            i__8616 = G__8619;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8614), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8611)))
      }else {
        var f__8617 = cljs.core.first.call(null, s__8611);
        var r__8618 = cljs.core.rest.call(null, s__8611);
        if(cljs.core.truth_(pred.call(null, f__8617))) {
          return cljs.core.cons.call(null, f__8617, filter.call(null, pred, r__8618))
        }else {
          return filter.call(null, pred, r__8618)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8622 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8622.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8620_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8620_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8626__8627 = to;
    if(G__8626__8627) {
      if(function() {
        var or__3824__auto____8628 = G__8626__8627.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8628) {
          return or__3824__auto____8628
        }else {
          return G__8626__8627.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8626__8627.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8626__8627)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8626__8627)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__8629__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8629 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8629__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8629.cljs$lang$maxFixedArity = 4;
    G__8629.cljs$lang$applyTo = function(arglist__8630) {
      var f = cljs.core.first(arglist__8630);
      var c1 = cljs.core.first(cljs.core.next(arglist__8630));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8630)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8630))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8630))));
      return G__8629__delegate(f, c1, c2, c3, colls)
    };
    G__8629.cljs$lang$arity$variadic = G__8629__delegate;
    return G__8629
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8637 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8637) {
        var s__8638 = temp__3974__auto____8637;
        var p__8639 = cljs.core.take.call(null, n, s__8638);
        if(n === cljs.core.count.call(null, p__8639)) {
          return cljs.core.cons.call(null, p__8639, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8638)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8640 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8640) {
        var s__8641 = temp__3974__auto____8640;
        var p__8642 = cljs.core.take.call(null, n, s__8641);
        if(n === cljs.core.count.call(null, p__8642)) {
          return cljs.core.cons.call(null, p__8642, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8641)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8642, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__8647 = cljs.core.lookup_sentinel;
    var m__8648 = m;
    var ks__8649 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8649) {
        var m__8650 = cljs.core._lookup.call(null, m__8648, cljs.core.first.call(null, ks__8649), sentinel__8647);
        if(sentinel__8647 === m__8650) {
          return not_found
        }else {
          var G__8651 = sentinel__8647;
          var G__8652 = m__8650;
          var G__8653 = cljs.core.next.call(null, ks__8649);
          sentinel__8647 = G__8651;
          m__8648 = G__8652;
          ks__8649 = G__8653;
          continue
        }
      }else {
        return m__8648
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__8654, v) {
  var vec__8659__8660 = p__8654;
  var k__8661 = cljs.core.nth.call(null, vec__8659__8660, 0, null);
  var ks__8662 = cljs.core.nthnext.call(null, vec__8659__8660, 1);
  if(cljs.core.truth_(ks__8662)) {
    return cljs.core.assoc.call(null, m, k__8661, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8661, null), ks__8662, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8661, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8663, f, args) {
    var vec__8668__8669 = p__8663;
    var k__8670 = cljs.core.nth.call(null, vec__8668__8669, 0, null);
    var ks__8671 = cljs.core.nthnext.call(null, vec__8668__8669, 1);
    if(cljs.core.truth_(ks__8671)) {
      return cljs.core.assoc.call(null, m, k__8670, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8670, null), ks__8671, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8670, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8670, null), args))
    }
  };
  var update_in = function(m, p__8663, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8663, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8672) {
    var m = cljs.core.first(arglist__8672);
    var p__8663 = cljs.core.first(cljs.core.next(arglist__8672));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8672)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8672)));
    return update_in__delegate(m, p__8663, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8675 = this;
  var h__2247__auto____8676 = this__8675.__hash;
  if(!(h__2247__auto____8676 == null)) {
    return h__2247__auto____8676
  }else {
    var h__2247__auto____8677 = cljs.core.hash_coll.call(null, coll);
    this__8675.__hash = h__2247__auto____8677;
    return h__2247__auto____8677
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8678 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8679 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8680 = this;
  var new_array__8681 = this__8680.array.slice();
  new_array__8681[k] = v;
  return new cljs.core.Vector(this__8680.meta, new_array__8681, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8712 = null;
  var G__8712__2 = function(this_sym8682, k) {
    var this__8684 = this;
    var this_sym8682__8685 = this;
    var coll__8686 = this_sym8682__8685;
    return coll__8686.cljs$core$ILookup$_lookup$arity$2(coll__8686, k)
  };
  var G__8712__3 = function(this_sym8683, k, not_found) {
    var this__8684 = this;
    var this_sym8683__8687 = this;
    var coll__8688 = this_sym8683__8687;
    return coll__8688.cljs$core$ILookup$_lookup$arity$3(coll__8688, k, not_found)
  };
  G__8712 = function(this_sym8683, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8712__2.call(this, this_sym8683, k);
      case 3:
        return G__8712__3.call(this, this_sym8683, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8712
}();
cljs.core.Vector.prototype.apply = function(this_sym8673, args8674) {
  var this__8689 = this;
  return this_sym8673.call.apply(this_sym8673, [this_sym8673].concat(args8674.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8690 = this;
  var new_array__8691 = this__8690.array.slice();
  new_array__8691.push(o);
  return new cljs.core.Vector(this__8690.meta, new_array__8691, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8692 = this;
  var this__8693 = this;
  return cljs.core.pr_str.call(null, this__8693)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8694 = this;
  return cljs.core.ci_reduce.call(null, this__8694.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8695 = this;
  return cljs.core.ci_reduce.call(null, this__8695.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8696 = this;
  if(this__8696.array.length > 0) {
    var vector_seq__8697 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8696.array.length) {
          return cljs.core.cons.call(null, this__8696.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8697.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8698 = this;
  return this__8698.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8699 = this;
  var count__8700 = this__8699.array.length;
  if(count__8700 > 0) {
    return this__8699.array[count__8700 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8701 = this;
  if(this__8701.array.length > 0) {
    var new_array__8702 = this__8701.array.slice();
    new_array__8702.pop();
    return new cljs.core.Vector(this__8701.meta, new_array__8702, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8703 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8704 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8705 = this;
  return new cljs.core.Vector(meta, this__8705.array, this__8705.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8706 = this;
  return this__8706.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8707 = this;
  if(function() {
    var and__3822__auto____8708 = 0 <= n;
    if(and__3822__auto____8708) {
      return n < this__8707.array.length
    }else {
      return and__3822__auto____8708
    }
  }()) {
    return this__8707.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8709 = this;
  if(function() {
    var and__3822__auto____8710 = 0 <= n;
    if(and__3822__auto____8710) {
      return n < this__8709.array.length
    }else {
      return and__3822__auto____8710
    }
  }()) {
    return this__8709.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8711 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8711.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2365__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__8714 = pv.cnt;
  if(cnt__8714 < 32) {
    return 0
  }else {
    return cnt__8714 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8720 = level;
  var ret__8721 = node;
  while(true) {
    if(ll__8720 === 0) {
      return ret__8721
    }else {
      var embed__8722 = ret__8721;
      var r__8723 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8724 = cljs.core.pv_aset.call(null, r__8723, 0, embed__8722);
      var G__8725 = ll__8720 - 5;
      var G__8726 = r__8723;
      ll__8720 = G__8725;
      ret__8721 = G__8726;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8732 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8733 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8732, subidx__8733, tailnode);
    return ret__8732
  }else {
    var child__8734 = cljs.core.pv_aget.call(null, parent, subidx__8733);
    if(!(child__8734 == null)) {
      var node_to_insert__8735 = push_tail.call(null, pv, level - 5, child__8734, tailnode);
      cljs.core.pv_aset.call(null, ret__8732, subidx__8733, node_to_insert__8735);
      return ret__8732
    }else {
      var node_to_insert__8736 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8732, subidx__8733, node_to_insert__8736);
      return ret__8732
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8740 = 0 <= i;
    if(and__3822__auto____8740) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8740
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8741 = pv.root;
      var level__8742 = pv.shift;
      while(true) {
        if(level__8742 > 0) {
          var G__8743 = cljs.core.pv_aget.call(null, node__8741, i >>> level__8742 & 31);
          var G__8744 = level__8742 - 5;
          node__8741 = G__8743;
          level__8742 = G__8744;
          continue
        }else {
          return node__8741.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8747 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8747, i & 31, val);
    return ret__8747
  }else {
    var subidx__8748 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8747, subidx__8748, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8748), i, val));
    return ret__8747
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8754 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8755 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8754));
    if(function() {
      var and__3822__auto____8756 = new_child__8755 == null;
      if(and__3822__auto____8756) {
        return subidx__8754 === 0
      }else {
        return and__3822__auto____8756
      }
    }()) {
      return null
    }else {
      var ret__8757 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8757, subidx__8754, new_child__8755);
      return ret__8757
    }
  }else {
    if(subidx__8754 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8758 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8758, subidx__8754, null);
        return ret__8758
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8761 = this;
  return new cljs.core.TransientVector(this__8761.cnt, this__8761.shift, cljs.core.tv_editable_root.call(null, this__8761.root), cljs.core.tv_editable_tail.call(null, this__8761.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8762 = this;
  var h__2247__auto____8763 = this__8762.__hash;
  if(!(h__2247__auto____8763 == null)) {
    return h__2247__auto____8763
  }else {
    var h__2247__auto____8764 = cljs.core.hash_coll.call(null, coll);
    this__8762.__hash = h__2247__auto____8764;
    return h__2247__auto____8764
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8765 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8766 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8767 = this;
  if(function() {
    var and__3822__auto____8768 = 0 <= k;
    if(and__3822__auto____8768) {
      return k < this__8767.cnt
    }else {
      return and__3822__auto____8768
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8769 = this__8767.tail.slice();
      new_tail__8769[k & 31] = v;
      return new cljs.core.PersistentVector(this__8767.meta, this__8767.cnt, this__8767.shift, this__8767.root, new_tail__8769, null)
    }else {
      return new cljs.core.PersistentVector(this__8767.meta, this__8767.cnt, this__8767.shift, cljs.core.do_assoc.call(null, coll, this__8767.shift, this__8767.root, k, v), this__8767.tail, null)
    }
  }else {
    if(k === this__8767.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8767.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8817 = null;
  var G__8817__2 = function(this_sym8770, k) {
    var this__8772 = this;
    var this_sym8770__8773 = this;
    var coll__8774 = this_sym8770__8773;
    return coll__8774.cljs$core$ILookup$_lookup$arity$2(coll__8774, k)
  };
  var G__8817__3 = function(this_sym8771, k, not_found) {
    var this__8772 = this;
    var this_sym8771__8775 = this;
    var coll__8776 = this_sym8771__8775;
    return coll__8776.cljs$core$ILookup$_lookup$arity$3(coll__8776, k, not_found)
  };
  G__8817 = function(this_sym8771, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8817__2.call(this, this_sym8771, k);
      case 3:
        return G__8817__3.call(this, this_sym8771, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8817
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8759, args8760) {
  var this__8777 = this;
  return this_sym8759.call.apply(this_sym8759, [this_sym8759].concat(args8760.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8778 = this;
  var step_init__8779 = [0, init];
  var i__8780 = 0;
  while(true) {
    if(i__8780 < this__8778.cnt) {
      var arr__8781 = cljs.core.array_for.call(null, v, i__8780);
      var len__8782 = arr__8781.length;
      var init__8786 = function() {
        var j__8783 = 0;
        var init__8784 = step_init__8779[1];
        while(true) {
          if(j__8783 < len__8782) {
            var init__8785 = f.call(null, init__8784, j__8783 + i__8780, arr__8781[j__8783]);
            if(cljs.core.reduced_QMARK_.call(null, init__8785)) {
              return init__8785
            }else {
              var G__8818 = j__8783 + 1;
              var G__8819 = init__8785;
              j__8783 = G__8818;
              init__8784 = G__8819;
              continue
            }
          }else {
            step_init__8779[0] = len__8782;
            step_init__8779[1] = init__8784;
            return init__8784
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8786)) {
        return cljs.core.deref.call(null, init__8786)
      }else {
        var G__8820 = i__8780 + step_init__8779[0];
        i__8780 = G__8820;
        continue
      }
    }else {
      return step_init__8779[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8787 = this;
  if(this__8787.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8788 = this__8787.tail.slice();
    new_tail__8788.push(o);
    return new cljs.core.PersistentVector(this__8787.meta, this__8787.cnt + 1, this__8787.shift, this__8787.root, new_tail__8788, null)
  }else {
    var root_overflow_QMARK___8789 = this__8787.cnt >>> 5 > 1 << this__8787.shift;
    var new_shift__8790 = root_overflow_QMARK___8789 ? this__8787.shift + 5 : this__8787.shift;
    var new_root__8792 = root_overflow_QMARK___8789 ? function() {
      var n_r__8791 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8791, 0, this__8787.root);
      cljs.core.pv_aset.call(null, n_r__8791, 1, cljs.core.new_path.call(null, null, this__8787.shift, new cljs.core.VectorNode(null, this__8787.tail)));
      return n_r__8791
    }() : cljs.core.push_tail.call(null, coll, this__8787.shift, this__8787.root, new cljs.core.VectorNode(null, this__8787.tail));
    return new cljs.core.PersistentVector(this__8787.meta, this__8787.cnt + 1, new_shift__8790, new_root__8792, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8793 = this;
  if(this__8793.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8793.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8794 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8795 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8796 = this;
  var this__8797 = this;
  return cljs.core.pr_str.call(null, this__8797)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8798 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8799 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8800 = this;
  if(this__8800.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8801 = this;
  return this__8801.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8802 = this;
  if(this__8802.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8802.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8803 = this;
  if(this__8803.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8803.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8803.meta)
    }else {
      if(1 < this__8803.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8803.meta, this__8803.cnt - 1, this__8803.shift, this__8803.root, this__8803.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8804 = cljs.core.array_for.call(null, coll, this__8803.cnt - 2);
          var nr__8805 = cljs.core.pop_tail.call(null, coll, this__8803.shift, this__8803.root);
          var new_root__8806 = nr__8805 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8805;
          var cnt_1__8807 = this__8803.cnt - 1;
          if(function() {
            var and__3822__auto____8808 = 5 < this__8803.shift;
            if(and__3822__auto____8808) {
              return cljs.core.pv_aget.call(null, new_root__8806, 1) == null
            }else {
              return and__3822__auto____8808
            }
          }()) {
            return new cljs.core.PersistentVector(this__8803.meta, cnt_1__8807, this__8803.shift - 5, cljs.core.pv_aget.call(null, new_root__8806, 0), new_tail__8804, null)
          }else {
            return new cljs.core.PersistentVector(this__8803.meta, cnt_1__8807, this__8803.shift, new_root__8806, new_tail__8804, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8809 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8810 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8811 = this;
  return new cljs.core.PersistentVector(meta, this__8811.cnt, this__8811.shift, this__8811.root, this__8811.tail, this__8811.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8812 = this;
  return this__8812.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8813 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8814 = this;
  if(function() {
    var and__3822__auto____8815 = 0 <= n;
    if(and__3822__auto____8815) {
      return n < this__8814.cnt
    }else {
      return and__3822__auto____8815
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8816 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8816.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8821 = xs.length;
  var xs__8822 = no_clone === true ? xs : xs.slice();
  if(l__8821 < 32) {
    return new cljs.core.PersistentVector(null, l__8821, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8822, null)
  }else {
    var node__8823 = xs__8822.slice(0, 32);
    var v__8824 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8823, null);
    var i__8825 = 32;
    var out__8826 = cljs.core._as_transient.call(null, v__8824);
    while(true) {
      if(i__8825 < l__8821) {
        var G__8827 = i__8825 + 1;
        var G__8828 = cljs.core.conj_BANG_.call(null, out__8826, xs__8822[i__8825]);
        i__8825 = G__8827;
        out__8826 = G__8828;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8826)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8829) {
    var args = cljs.core.seq(arglist__8829);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8830 = this;
  if(this__8830.off + 1 < this__8830.node.length) {
    var s__8831 = cljs.core.chunked_seq.call(null, this__8830.vec, this__8830.node, this__8830.i, this__8830.off + 1);
    if(s__8831 == null) {
      return null
    }else {
      return s__8831
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8832 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8833 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8834 = this;
  return this__8834.node[this__8834.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8835 = this;
  if(this__8835.off + 1 < this__8835.node.length) {
    var s__8836 = cljs.core.chunked_seq.call(null, this__8835.vec, this__8835.node, this__8835.i, this__8835.off + 1);
    if(s__8836 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8836
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8837 = this;
  var l__8838 = this__8837.node.length;
  var s__8839 = this__8837.i + l__8838 < cljs.core._count.call(null, this__8837.vec) ? cljs.core.chunked_seq.call(null, this__8837.vec, this__8837.i + l__8838, 0) : null;
  if(s__8839 == null) {
    return null
  }else {
    return s__8839
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8840 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8841 = this;
  return cljs.core.chunked_seq.call(null, this__8841.vec, this__8841.node, this__8841.i, this__8841.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8842 = this;
  return this__8842.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8843 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8843.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8844 = this;
  return cljs.core.array_chunk.call(null, this__8844.node, this__8844.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8845 = this;
  var l__8846 = this__8845.node.length;
  var s__8847 = this__8845.i + l__8846 < cljs.core._count.call(null, this__8845.vec) ? cljs.core.chunked_seq.call(null, this__8845.vec, this__8845.i + l__8846, 0) : null;
  if(s__8847 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8847
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8850 = this;
  var h__2247__auto____8851 = this__8850.__hash;
  if(!(h__2247__auto____8851 == null)) {
    return h__2247__auto____8851
  }else {
    var h__2247__auto____8852 = cljs.core.hash_coll.call(null, coll);
    this__8850.__hash = h__2247__auto____8852;
    return h__2247__auto____8852
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8853 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8854 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8855 = this;
  var v_pos__8856 = this__8855.start + key;
  return new cljs.core.Subvec(this__8855.meta, cljs.core._assoc.call(null, this__8855.v, v_pos__8856, val), this__8855.start, this__8855.end > v_pos__8856 + 1 ? this__8855.end : v_pos__8856 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8882 = null;
  var G__8882__2 = function(this_sym8857, k) {
    var this__8859 = this;
    var this_sym8857__8860 = this;
    var coll__8861 = this_sym8857__8860;
    return coll__8861.cljs$core$ILookup$_lookup$arity$2(coll__8861, k)
  };
  var G__8882__3 = function(this_sym8858, k, not_found) {
    var this__8859 = this;
    var this_sym8858__8862 = this;
    var coll__8863 = this_sym8858__8862;
    return coll__8863.cljs$core$ILookup$_lookup$arity$3(coll__8863, k, not_found)
  };
  G__8882 = function(this_sym8858, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8882__2.call(this, this_sym8858, k);
      case 3:
        return G__8882__3.call(this, this_sym8858, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8882
}();
cljs.core.Subvec.prototype.apply = function(this_sym8848, args8849) {
  var this__8864 = this;
  return this_sym8848.call.apply(this_sym8848, [this_sym8848].concat(args8849.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8865 = this;
  return new cljs.core.Subvec(this__8865.meta, cljs.core._assoc_n.call(null, this__8865.v, this__8865.end, o), this__8865.start, this__8865.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8866 = this;
  var this__8867 = this;
  return cljs.core.pr_str.call(null, this__8867)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8868 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8869 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8870 = this;
  var subvec_seq__8871 = function subvec_seq(i) {
    if(i === this__8870.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8870.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8871.call(null, this__8870.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8872 = this;
  return this__8872.end - this__8872.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8873 = this;
  return cljs.core._nth.call(null, this__8873.v, this__8873.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8874 = this;
  if(this__8874.start === this__8874.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8874.meta, this__8874.v, this__8874.start, this__8874.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8875 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8876 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8877 = this;
  return new cljs.core.Subvec(meta, this__8877.v, this__8877.start, this__8877.end, this__8877.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8878 = this;
  return this__8878.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8879 = this;
  return cljs.core._nth.call(null, this__8879.v, this__8879.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8880 = this;
  return cljs.core._nth.call(null, this__8880.v, this__8880.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8881 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8881.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__8884 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8884, 0, tl.length);
  return ret__8884
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8888 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8889 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8888, subidx__8889, level === 5 ? tail_node : function() {
    var child__8890 = cljs.core.pv_aget.call(null, ret__8888, subidx__8889);
    if(!(child__8890 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8890, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8888
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8895 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8896 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8897 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8895, subidx__8896));
    if(function() {
      var and__3822__auto____8898 = new_child__8897 == null;
      if(and__3822__auto____8898) {
        return subidx__8896 === 0
      }else {
        return and__3822__auto____8898
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8895, subidx__8896, new_child__8897);
      return node__8895
    }
  }else {
    if(subidx__8896 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8895, subidx__8896, null);
        return node__8895
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8903 = 0 <= i;
    if(and__3822__auto____8903) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8903
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8904 = tv.root;
      var node__8905 = root__8904;
      var level__8906 = tv.shift;
      while(true) {
        if(level__8906 > 0) {
          var G__8907 = cljs.core.tv_ensure_editable.call(null, root__8904.edit, cljs.core.pv_aget.call(null, node__8905, i >>> level__8906 & 31));
          var G__8908 = level__8906 - 5;
          node__8905 = G__8907;
          level__8906 = G__8908;
          continue
        }else {
          return node__8905.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__8948 = null;
  var G__8948__2 = function(this_sym8911, k) {
    var this__8913 = this;
    var this_sym8911__8914 = this;
    var coll__8915 = this_sym8911__8914;
    return coll__8915.cljs$core$ILookup$_lookup$arity$2(coll__8915, k)
  };
  var G__8948__3 = function(this_sym8912, k, not_found) {
    var this__8913 = this;
    var this_sym8912__8916 = this;
    var coll__8917 = this_sym8912__8916;
    return coll__8917.cljs$core$ILookup$_lookup$arity$3(coll__8917, k, not_found)
  };
  G__8948 = function(this_sym8912, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8948__2.call(this, this_sym8912, k);
      case 3:
        return G__8948__3.call(this, this_sym8912, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8948
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8909, args8910) {
  var this__8918 = this;
  return this_sym8909.call.apply(this_sym8909, [this_sym8909].concat(args8910.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8919 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8920 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8921 = this;
  if(this__8921.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8922 = this;
  if(function() {
    var and__3822__auto____8923 = 0 <= n;
    if(and__3822__auto____8923) {
      return n < this__8922.cnt
    }else {
      return and__3822__auto____8923
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8924 = this;
  if(this__8924.root.edit) {
    return this__8924.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8925 = this;
  if(this__8925.root.edit) {
    if(function() {
      var and__3822__auto____8926 = 0 <= n;
      if(and__3822__auto____8926) {
        return n < this__8925.cnt
      }else {
        return and__3822__auto____8926
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8925.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8931 = function go(level, node) {
          var node__8929 = cljs.core.tv_ensure_editable.call(null, this__8925.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8929, n & 31, val);
            return node__8929
          }else {
            var subidx__8930 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8929, subidx__8930, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8929, subidx__8930)));
            return node__8929
          }
        }.call(null, this__8925.shift, this__8925.root);
        this__8925.root = new_root__8931;
        return tcoll
      }
    }else {
      if(n === this__8925.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8925.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__8932 = this;
  if(this__8932.root.edit) {
    if(this__8932.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8932.cnt) {
        this__8932.cnt = 0;
        return tcoll
      }else {
        if((this__8932.cnt - 1 & 31) > 0) {
          this__8932.cnt = this__8932.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8933 = cljs.core.editable_array_for.call(null, tcoll, this__8932.cnt - 2);
            var new_root__8935 = function() {
              var nr__8934 = cljs.core.tv_pop_tail.call(null, tcoll, this__8932.shift, this__8932.root);
              if(!(nr__8934 == null)) {
                return nr__8934
              }else {
                return new cljs.core.VectorNode(this__8932.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____8936 = 5 < this__8932.shift;
              if(and__3822__auto____8936) {
                return cljs.core.pv_aget.call(null, new_root__8935, 1) == null
              }else {
                return and__3822__auto____8936
              }
            }()) {
              var new_root__8937 = cljs.core.tv_ensure_editable.call(null, this__8932.root.edit, cljs.core.pv_aget.call(null, new_root__8935, 0));
              this__8932.root = new_root__8937;
              this__8932.shift = this__8932.shift - 5;
              this__8932.cnt = this__8932.cnt - 1;
              this__8932.tail = new_tail__8933;
              return tcoll
            }else {
              this__8932.root = new_root__8935;
              this__8932.cnt = this__8932.cnt - 1;
              this__8932.tail = new_tail__8933;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8938 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8939 = this;
  if(this__8939.root.edit) {
    if(this__8939.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8939.tail[this__8939.cnt & 31] = o;
      this__8939.cnt = this__8939.cnt + 1;
      return tcoll
    }else {
      var tail_node__8940 = new cljs.core.VectorNode(this__8939.root.edit, this__8939.tail);
      var new_tail__8941 = cljs.core.make_array.call(null, 32);
      new_tail__8941[0] = o;
      this__8939.tail = new_tail__8941;
      if(this__8939.cnt >>> 5 > 1 << this__8939.shift) {
        var new_root_array__8942 = cljs.core.make_array.call(null, 32);
        var new_shift__8943 = this__8939.shift + 5;
        new_root_array__8942[0] = this__8939.root;
        new_root_array__8942[1] = cljs.core.new_path.call(null, this__8939.root.edit, this__8939.shift, tail_node__8940);
        this__8939.root = new cljs.core.VectorNode(this__8939.root.edit, new_root_array__8942);
        this__8939.shift = new_shift__8943;
        this__8939.cnt = this__8939.cnt + 1;
        return tcoll
      }else {
        var new_root__8944 = cljs.core.tv_push_tail.call(null, tcoll, this__8939.shift, this__8939.root, tail_node__8940);
        this__8939.root = new_root__8944;
        this__8939.cnt = this__8939.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8945 = this;
  if(this__8945.root.edit) {
    this__8945.root.edit = null;
    var len__8946 = this__8945.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8947 = cljs.core.make_array.call(null, len__8946);
    cljs.core.array_copy.call(null, this__8945.tail, 0, trimmed_tail__8947, 0, len__8946);
    return new cljs.core.PersistentVector(null, this__8945.cnt, this__8945.shift, this__8945.root, trimmed_tail__8947, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8949 = this;
  var h__2247__auto____8950 = this__8949.__hash;
  if(!(h__2247__auto____8950 == null)) {
    return h__2247__auto____8950
  }else {
    var h__2247__auto____8951 = cljs.core.hash_coll.call(null, coll);
    this__8949.__hash = h__2247__auto____8951;
    return h__2247__auto____8951
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8952 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8953 = this;
  var this__8954 = this;
  return cljs.core.pr_str.call(null, this__8954)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8955 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8956 = this;
  return cljs.core._first.call(null, this__8956.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8957 = this;
  var temp__3971__auto____8958 = cljs.core.next.call(null, this__8957.front);
  if(temp__3971__auto____8958) {
    var f1__8959 = temp__3971__auto____8958;
    return new cljs.core.PersistentQueueSeq(this__8957.meta, f1__8959, this__8957.rear, null)
  }else {
    if(this__8957.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8957.meta, this__8957.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8960 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8961 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8961.front, this__8961.rear, this__8961.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8962 = this;
  return this__8962.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8963 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8963.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8964 = this;
  var h__2247__auto____8965 = this__8964.__hash;
  if(!(h__2247__auto____8965 == null)) {
    return h__2247__auto____8965
  }else {
    var h__2247__auto____8966 = cljs.core.hash_coll.call(null, coll);
    this__8964.__hash = h__2247__auto____8966;
    return h__2247__auto____8966
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8967 = this;
  if(cljs.core.truth_(this__8967.front)) {
    return new cljs.core.PersistentQueue(this__8967.meta, this__8967.count + 1, this__8967.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____8968 = this__8967.rear;
      if(cljs.core.truth_(or__3824__auto____8968)) {
        return or__3824__auto____8968
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8967.meta, this__8967.count + 1, cljs.core.conj.call(null, this__8967.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8969 = this;
  var this__8970 = this;
  return cljs.core.pr_str.call(null, this__8970)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8971 = this;
  var rear__8972 = cljs.core.seq.call(null, this__8971.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8973 = this__8971.front;
    if(cljs.core.truth_(or__3824__auto____8973)) {
      return or__3824__auto____8973
    }else {
      return rear__8972
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8971.front, cljs.core.seq.call(null, rear__8972), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8974 = this;
  return this__8974.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8975 = this;
  return cljs.core._first.call(null, this__8975.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8976 = this;
  if(cljs.core.truth_(this__8976.front)) {
    var temp__3971__auto____8977 = cljs.core.next.call(null, this__8976.front);
    if(temp__3971__auto____8977) {
      var f1__8978 = temp__3971__auto____8977;
      return new cljs.core.PersistentQueue(this__8976.meta, this__8976.count - 1, f1__8978, this__8976.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8976.meta, this__8976.count - 1, cljs.core.seq.call(null, this__8976.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8979 = this;
  return cljs.core.first.call(null, this__8979.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8980 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8981 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8982 = this;
  return new cljs.core.PersistentQueue(meta, this__8982.count, this__8982.front, this__8982.rear, this__8982.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8983 = this;
  return this__8983.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8984 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8985 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8988 = array.length;
  var i__8989 = 0;
  while(true) {
    if(i__8989 < len__8988) {
      if(k === array[i__8989]) {
        return i__8989
      }else {
        var G__8990 = i__8989 + incr;
        i__8989 = G__8990;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8993 = cljs.core.hash.call(null, a);
  var b__8994 = cljs.core.hash.call(null, b);
  if(a__8993 < b__8994) {
    return-1
  }else {
    if(a__8993 > b__8994) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__9002 = m.keys;
  var len__9003 = ks__9002.length;
  var so__9004 = m.strobj;
  var out__9005 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__9006 = 0;
  var out__9007 = cljs.core.transient$.call(null, out__9005);
  while(true) {
    if(i__9006 < len__9003) {
      var k__9008 = ks__9002[i__9006];
      var G__9009 = i__9006 + 1;
      var G__9010 = cljs.core.assoc_BANG_.call(null, out__9007, k__9008, so__9004[k__9008]);
      i__9006 = G__9009;
      out__9007 = G__9010;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__9007, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__9016 = {};
  var l__9017 = ks.length;
  var i__9018 = 0;
  while(true) {
    if(i__9018 < l__9017) {
      var k__9019 = ks[i__9018];
      new_obj__9016[k__9019] = obj[k__9019];
      var G__9020 = i__9018 + 1;
      i__9018 = G__9020;
      continue
    }else {
    }
    break
  }
  return new_obj__9016
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9023 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9024 = this;
  var h__2247__auto____9025 = this__9024.__hash;
  if(!(h__2247__auto____9025 == null)) {
    return h__2247__auto____9025
  }else {
    var h__2247__auto____9026 = cljs.core.hash_imap.call(null, coll);
    this__9024.__hash = h__2247__auto____9026;
    return h__2247__auto____9026
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9027 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9028 = this;
  if(function() {
    var and__3822__auto____9029 = goog.isString(k);
    if(and__3822__auto____9029) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9028.keys) == null)
    }else {
      return and__3822__auto____9029
    }
  }()) {
    return this__9028.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9030 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____9031 = this__9030.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____9031) {
        return or__3824__auto____9031
      }else {
        return this__9030.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__9030.keys) == null)) {
        var new_strobj__9032 = cljs.core.obj_clone.call(null, this__9030.strobj, this__9030.keys);
        new_strobj__9032[k] = v;
        return new cljs.core.ObjMap(this__9030.meta, this__9030.keys, new_strobj__9032, this__9030.update_count + 1, null)
      }else {
        var new_strobj__9033 = cljs.core.obj_clone.call(null, this__9030.strobj, this__9030.keys);
        var new_keys__9034 = this__9030.keys.slice();
        new_strobj__9033[k] = v;
        new_keys__9034.push(k);
        return new cljs.core.ObjMap(this__9030.meta, new_keys__9034, new_strobj__9033, this__9030.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9035 = this;
  if(function() {
    var and__3822__auto____9036 = goog.isString(k);
    if(and__3822__auto____9036) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9035.keys) == null)
    }else {
      return and__3822__auto____9036
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__9058 = null;
  var G__9058__2 = function(this_sym9037, k) {
    var this__9039 = this;
    var this_sym9037__9040 = this;
    var coll__9041 = this_sym9037__9040;
    return coll__9041.cljs$core$ILookup$_lookup$arity$2(coll__9041, k)
  };
  var G__9058__3 = function(this_sym9038, k, not_found) {
    var this__9039 = this;
    var this_sym9038__9042 = this;
    var coll__9043 = this_sym9038__9042;
    return coll__9043.cljs$core$ILookup$_lookup$arity$3(coll__9043, k, not_found)
  };
  G__9058 = function(this_sym9038, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9058__2.call(this, this_sym9038, k);
      case 3:
        return G__9058__3.call(this, this_sym9038, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9058
}();
cljs.core.ObjMap.prototype.apply = function(this_sym9021, args9022) {
  var this__9044 = this;
  return this_sym9021.call.apply(this_sym9021, [this_sym9021].concat(args9022.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9045 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__9046 = this;
  var this__9047 = this;
  return cljs.core.pr_str.call(null, this__9047)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9048 = this;
  if(this__9048.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__9011_SHARP_) {
      return cljs.core.vector.call(null, p1__9011_SHARP_, this__9048.strobj[p1__9011_SHARP_])
    }, this__9048.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9049 = this;
  return this__9049.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9050 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9051 = this;
  return new cljs.core.ObjMap(meta, this__9051.keys, this__9051.strobj, this__9051.update_count, this__9051.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9052 = this;
  return this__9052.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9053 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__9053.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9054 = this;
  if(function() {
    var and__3822__auto____9055 = goog.isString(k);
    if(and__3822__auto____9055) {
      return!(cljs.core.scan_array.call(null, 1, k, this__9054.keys) == null)
    }else {
      return and__3822__auto____9055
    }
  }()) {
    var new_keys__9056 = this__9054.keys.slice();
    var new_strobj__9057 = cljs.core.obj_clone.call(null, this__9054.strobj, this__9054.keys);
    new_keys__9056.splice(cljs.core.scan_array.call(null, 1, k, new_keys__9056), 1);
    cljs.core.js_delete.call(null, new_strobj__9057, k);
    return new cljs.core.ObjMap(this__9054.meta, new_keys__9056, new_strobj__9057, this__9054.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9062 = this;
  var h__2247__auto____9063 = this__9062.__hash;
  if(!(h__2247__auto____9063 == null)) {
    return h__2247__auto____9063
  }else {
    var h__2247__auto____9064 = cljs.core.hash_imap.call(null, coll);
    this__9062.__hash = h__2247__auto____9064;
    return h__2247__auto____9064
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9065 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9066 = this;
  var bucket__9067 = this__9066.hashobj[cljs.core.hash.call(null, k)];
  var i__9068 = cljs.core.truth_(bucket__9067) ? cljs.core.scan_array.call(null, 2, k, bucket__9067) : null;
  if(cljs.core.truth_(i__9068)) {
    return bucket__9067[i__9068 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9069 = this;
  var h__9070 = cljs.core.hash.call(null, k);
  var bucket__9071 = this__9069.hashobj[h__9070];
  if(cljs.core.truth_(bucket__9071)) {
    var new_bucket__9072 = bucket__9071.slice();
    var new_hashobj__9073 = goog.object.clone(this__9069.hashobj);
    new_hashobj__9073[h__9070] = new_bucket__9072;
    var temp__3971__auto____9074 = cljs.core.scan_array.call(null, 2, k, new_bucket__9072);
    if(cljs.core.truth_(temp__3971__auto____9074)) {
      var i__9075 = temp__3971__auto____9074;
      new_bucket__9072[i__9075 + 1] = v;
      return new cljs.core.HashMap(this__9069.meta, this__9069.count, new_hashobj__9073, null)
    }else {
      new_bucket__9072.push(k, v);
      return new cljs.core.HashMap(this__9069.meta, this__9069.count + 1, new_hashobj__9073, null)
    }
  }else {
    var new_hashobj__9076 = goog.object.clone(this__9069.hashobj);
    new_hashobj__9076[h__9070] = [k, v];
    return new cljs.core.HashMap(this__9069.meta, this__9069.count + 1, new_hashobj__9076, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9077 = this;
  var bucket__9078 = this__9077.hashobj[cljs.core.hash.call(null, k)];
  var i__9079 = cljs.core.truth_(bucket__9078) ? cljs.core.scan_array.call(null, 2, k, bucket__9078) : null;
  if(cljs.core.truth_(i__9079)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__9104 = null;
  var G__9104__2 = function(this_sym9080, k) {
    var this__9082 = this;
    var this_sym9080__9083 = this;
    var coll__9084 = this_sym9080__9083;
    return coll__9084.cljs$core$ILookup$_lookup$arity$2(coll__9084, k)
  };
  var G__9104__3 = function(this_sym9081, k, not_found) {
    var this__9082 = this;
    var this_sym9081__9085 = this;
    var coll__9086 = this_sym9081__9085;
    return coll__9086.cljs$core$ILookup$_lookup$arity$3(coll__9086, k, not_found)
  };
  G__9104 = function(this_sym9081, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9104__2.call(this, this_sym9081, k);
      case 3:
        return G__9104__3.call(this, this_sym9081, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9104
}();
cljs.core.HashMap.prototype.apply = function(this_sym9060, args9061) {
  var this__9087 = this;
  return this_sym9060.call.apply(this_sym9060, [this_sym9060].concat(args9061.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9088 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__9089 = this;
  var this__9090 = this;
  return cljs.core.pr_str.call(null, this__9090)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9091 = this;
  if(this__9091.count > 0) {
    var hashes__9092 = cljs.core.js_keys.call(null, this__9091.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__9059_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__9091.hashobj[p1__9059_SHARP_]))
    }, hashes__9092)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9093 = this;
  return this__9093.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9094 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9095 = this;
  return new cljs.core.HashMap(meta, this__9095.count, this__9095.hashobj, this__9095.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9096 = this;
  return this__9096.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9097 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__9097.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9098 = this;
  var h__9099 = cljs.core.hash.call(null, k);
  var bucket__9100 = this__9098.hashobj[h__9099];
  var i__9101 = cljs.core.truth_(bucket__9100) ? cljs.core.scan_array.call(null, 2, k, bucket__9100) : null;
  if(cljs.core.not.call(null, i__9101)) {
    return coll
  }else {
    var new_hashobj__9102 = goog.object.clone(this__9098.hashobj);
    if(3 > bucket__9100.length) {
      cljs.core.js_delete.call(null, new_hashobj__9102, h__9099)
    }else {
      var new_bucket__9103 = bucket__9100.slice();
      new_bucket__9103.splice(i__9101, 2);
      new_hashobj__9102[h__9099] = new_bucket__9103
    }
    return new cljs.core.HashMap(this__9098.meta, this__9098.count - 1, new_hashobj__9102, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__9105 = ks.length;
  var i__9106 = 0;
  var out__9107 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__9106 < len__9105) {
      var G__9108 = i__9106 + 1;
      var G__9109 = cljs.core.assoc.call(null, out__9107, ks[i__9106], vs[i__9106]);
      i__9106 = G__9108;
      out__9107 = G__9109;
      continue
    }else {
      return out__9107
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__9113 = m.arr;
  var len__9114 = arr__9113.length;
  var i__9115 = 0;
  while(true) {
    if(len__9114 <= i__9115) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__9113[i__9115], k)) {
        return i__9115
      }else {
        if("\ufdd0'else") {
          var G__9116 = i__9115 + 2;
          i__9115 = G__9116;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9119 = this;
  return new cljs.core.TransientArrayMap({}, this__9119.arr.length, this__9119.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9120 = this;
  var h__2247__auto____9121 = this__9120.__hash;
  if(!(h__2247__auto____9121 == null)) {
    return h__2247__auto____9121
  }else {
    var h__2247__auto____9122 = cljs.core.hash_imap.call(null, coll);
    this__9120.__hash = h__2247__auto____9122;
    return h__2247__auto____9122
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9123 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9124 = this;
  var idx__9125 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9125 === -1) {
    return not_found
  }else {
    return this__9124.arr[idx__9125 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9126 = this;
  var idx__9127 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9127 === -1) {
    if(this__9126.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__9126.meta, this__9126.cnt + 1, function() {
        var G__9128__9129 = this__9126.arr.slice();
        G__9128__9129.push(k);
        G__9128__9129.push(v);
        return G__9128__9129
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__9126.arr[idx__9127 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__9126.meta, this__9126.cnt, function() {
          var G__9130__9131 = this__9126.arr.slice();
          G__9130__9131[idx__9127 + 1] = v;
          return G__9130__9131
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9132 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__9164 = null;
  var G__9164__2 = function(this_sym9133, k) {
    var this__9135 = this;
    var this_sym9133__9136 = this;
    var coll__9137 = this_sym9133__9136;
    return coll__9137.cljs$core$ILookup$_lookup$arity$2(coll__9137, k)
  };
  var G__9164__3 = function(this_sym9134, k, not_found) {
    var this__9135 = this;
    var this_sym9134__9138 = this;
    var coll__9139 = this_sym9134__9138;
    return coll__9139.cljs$core$ILookup$_lookup$arity$3(coll__9139, k, not_found)
  };
  G__9164 = function(this_sym9134, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9164__2.call(this, this_sym9134, k);
      case 3:
        return G__9164__3.call(this, this_sym9134, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9164
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym9117, args9118) {
  var this__9140 = this;
  return this_sym9117.call.apply(this_sym9117, [this_sym9117].concat(args9118.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9141 = this;
  var len__9142 = this__9141.arr.length;
  var i__9143 = 0;
  var init__9144 = init;
  while(true) {
    if(i__9143 < len__9142) {
      var init__9145 = f.call(null, init__9144, this__9141.arr[i__9143], this__9141.arr[i__9143 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__9145)) {
        return cljs.core.deref.call(null, init__9145)
      }else {
        var G__9165 = i__9143 + 2;
        var G__9166 = init__9145;
        i__9143 = G__9165;
        init__9144 = G__9166;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9146 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__9147 = this;
  var this__9148 = this;
  return cljs.core.pr_str.call(null, this__9148)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9149 = this;
  if(this__9149.cnt > 0) {
    var len__9150 = this__9149.arr.length;
    var array_map_seq__9151 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__9150) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__9149.arr[i], this__9149.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__9151.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9152 = this;
  return this__9152.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9153 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9154 = this;
  return new cljs.core.PersistentArrayMap(meta, this__9154.cnt, this__9154.arr, this__9154.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9155 = this;
  return this__9155.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9156 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__9156.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9157 = this;
  var idx__9158 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9158 >= 0) {
    var len__9159 = this__9157.arr.length;
    var new_len__9160 = len__9159 - 2;
    if(new_len__9160 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__9161 = cljs.core.make_array.call(null, new_len__9160);
      var s__9162 = 0;
      var d__9163 = 0;
      while(true) {
        if(s__9162 >= len__9159) {
          return new cljs.core.PersistentArrayMap(this__9157.meta, this__9157.cnt - 1, new_arr__9161, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__9157.arr[s__9162])) {
            var G__9167 = s__9162 + 2;
            var G__9168 = d__9163;
            s__9162 = G__9167;
            d__9163 = G__9168;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__9161[d__9163] = this__9157.arr[s__9162];
              new_arr__9161[d__9163 + 1] = this__9157.arr[s__9162 + 1];
              var G__9169 = s__9162 + 2;
              var G__9170 = d__9163 + 2;
              s__9162 = G__9169;
              d__9163 = G__9170;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__9171 = cljs.core.count.call(null, ks);
  var i__9172 = 0;
  var out__9173 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__9172 < len__9171) {
      var G__9174 = i__9172 + 1;
      var G__9175 = cljs.core.assoc_BANG_.call(null, out__9173, ks[i__9172], vs[i__9172]);
      i__9172 = G__9174;
      out__9173 = G__9175;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9173)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9176 = this;
  if(cljs.core.truth_(this__9176.editable_QMARK_)) {
    var idx__9177 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9177 >= 0) {
      this__9176.arr[idx__9177] = this__9176.arr[this__9176.len - 2];
      this__9176.arr[idx__9177 + 1] = this__9176.arr[this__9176.len - 1];
      var G__9178__9179 = this__9176.arr;
      G__9178__9179.pop();
      G__9178__9179.pop();
      G__9178__9179;
      this__9176.len = this__9176.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9180 = this;
  if(cljs.core.truth_(this__9180.editable_QMARK_)) {
    var idx__9181 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9181 === -1) {
      if(this__9180.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__9180.len = this__9180.len + 2;
        this__9180.arr.push(key);
        this__9180.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__9180.len, this__9180.arr), key, val)
      }
    }else {
      if(val === this__9180.arr[idx__9181 + 1]) {
        return tcoll
      }else {
        this__9180.arr[idx__9181 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9182 = this;
  if(cljs.core.truth_(this__9182.editable_QMARK_)) {
    if(function() {
      var G__9183__9184 = o;
      if(G__9183__9184) {
        if(function() {
          var or__3824__auto____9185 = G__9183__9184.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9185) {
            return or__3824__auto____9185
          }else {
            return G__9183__9184.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9183__9184.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9183__9184)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9183__9184)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9186 = cljs.core.seq.call(null, o);
      var tcoll__9187 = tcoll;
      while(true) {
        var temp__3971__auto____9188 = cljs.core.first.call(null, es__9186);
        if(cljs.core.truth_(temp__3971__auto____9188)) {
          var e__9189 = temp__3971__auto____9188;
          var G__9195 = cljs.core.next.call(null, es__9186);
          var G__9196 = tcoll__9187.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__9187, cljs.core.key.call(null, e__9189), cljs.core.val.call(null, e__9189));
          es__9186 = G__9195;
          tcoll__9187 = G__9196;
          continue
        }else {
          return tcoll__9187
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9190 = this;
  if(cljs.core.truth_(this__9190.editable_QMARK_)) {
    this__9190.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__9190.len, 2), this__9190.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9191 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9192 = this;
  if(cljs.core.truth_(this__9192.editable_QMARK_)) {
    var idx__9193 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__9193 === -1) {
      return not_found
    }else {
      return this__9192.arr[idx__9193 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9194 = this;
  if(cljs.core.truth_(this__9194.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__9194.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__9199 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__9200 = 0;
  while(true) {
    if(i__9200 < len) {
      var G__9201 = cljs.core.assoc_BANG_.call(null, out__9199, arr[i__9200], arr[i__9200 + 1]);
      var G__9202 = i__9200 + 2;
      out__9199 = G__9201;
      i__9200 = G__9202;
      continue
    }else {
      return out__9199
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2365__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__9207__9208 = arr.slice();
    G__9207__9208[i] = a;
    return G__9207__9208
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__9209__9210 = arr.slice();
    G__9209__9210[i] = a;
    G__9209__9210[j] = b;
    return G__9209__9210
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__9212 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__9212, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__9212, 2 * i, new_arr__9212.length - 2 * i);
  return new_arr__9212
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__9215 = inode.ensure_editable(edit);
    editable__9215.arr[i] = a;
    return editable__9215
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__9216 = inode.ensure_editable(edit);
    editable__9216.arr[i] = a;
    editable__9216.arr[j] = b;
    return editable__9216
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__9223 = arr.length;
  var i__9224 = 0;
  var init__9225 = init;
  while(true) {
    if(i__9224 < len__9223) {
      var init__9228 = function() {
        var k__9226 = arr[i__9224];
        if(!(k__9226 == null)) {
          return f.call(null, init__9225, k__9226, arr[i__9224 + 1])
        }else {
          var node__9227 = arr[i__9224 + 1];
          if(!(node__9227 == null)) {
            return node__9227.kv_reduce(f, init__9225)
          }else {
            return init__9225
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__9228)) {
        return cljs.core.deref.call(null, init__9228)
      }else {
        var G__9229 = i__9224 + 2;
        var G__9230 = init__9228;
        i__9224 = G__9229;
        init__9225 = G__9230;
        continue
      }
    }else {
      return init__9225
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__9231 = this;
  var inode__9232 = this;
  if(this__9231.bitmap === bit) {
    return null
  }else {
    var editable__9233 = inode__9232.ensure_editable(e);
    var earr__9234 = editable__9233.arr;
    var len__9235 = earr__9234.length;
    editable__9233.bitmap = bit ^ editable__9233.bitmap;
    cljs.core.array_copy.call(null, earr__9234, 2 * (i + 1), earr__9234, 2 * i, len__9235 - 2 * (i + 1));
    earr__9234[len__9235 - 2] = null;
    earr__9234[len__9235 - 1] = null;
    return editable__9233
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9236 = this;
  var inode__9237 = this;
  var bit__9238 = 1 << (hash >>> shift & 31);
  var idx__9239 = cljs.core.bitmap_indexed_node_index.call(null, this__9236.bitmap, bit__9238);
  if((this__9236.bitmap & bit__9238) === 0) {
    var n__9240 = cljs.core.bit_count.call(null, this__9236.bitmap);
    if(2 * n__9240 < this__9236.arr.length) {
      var editable__9241 = inode__9237.ensure_editable(edit);
      var earr__9242 = editable__9241.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__9242, 2 * idx__9239, earr__9242, 2 * (idx__9239 + 1), 2 * (n__9240 - idx__9239));
      earr__9242[2 * idx__9239] = key;
      earr__9242[2 * idx__9239 + 1] = val;
      editable__9241.bitmap = editable__9241.bitmap | bit__9238;
      return editable__9241
    }else {
      if(n__9240 >= 16) {
        var nodes__9243 = cljs.core.make_array.call(null, 32);
        var jdx__9244 = hash >>> shift & 31;
        nodes__9243[jdx__9244] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__9245 = 0;
        var j__9246 = 0;
        while(true) {
          if(i__9245 < 32) {
            if((this__9236.bitmap >>> i__9245 & 1) === 0) {
              var G__9299 = i__9245 + 1;
              var G__9300 = j__9246;
              i__9245 = G__9299;
              j__9246 = G__9300;
              continue
            }else {
              nodes__9243[i__9245] = !(this__9236.arr[j__9246] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__9236.arr[j__9246]), this__9236.arr[j__9246], this__9236.arr[j__9246 + 1], added_leaf_QMARK_) : this__9236.arr[j__9246 + 1];
              var G__9301 = i__9245 + 1;
              var G__9302 = j__9246 + 2;
              i__9245 = G__9301;
              j__9246 = G__9302;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__9240 + 1, nodes__9243)
      }else {
        if("\ufdd0'else") {
          var new_arr__9247 = cljs.core.make_array.call(null, 2 * (n__9240 + 4));
          cljs.core.array_copy.call(null, this__9236.arr, 0, new_arr__9247, 0, 2 * idx__9239);
          new_arr__9247[2 * idx__9239] = key;
          new_arr__9247[2 * idx__9239 + 1] = val;
          cljs.core.array_copy.call(null, this__9236.arr, 2 * idx__9239, new_arr__9247, 2 * (idx__9239 + 1), 2 * (n__9240 - idx__9239));
          added_leaf_QMARK_.val = true;
          var editable__9248 = inode__9237.ensure_editable(edit);
          editable__9248.arr = new_arr__9247;
          editable__9248.bitmap = editable__9248.bitmap | bit__9238;
          return editable__9248
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__9249 = this__9236.arr[2 * idx__9239];
    var val_or_node__9250 = this__9236.arr[2 * idx__9239 + 1];
    if(key_or_nil__9249 == null) {
      var n__9251 = val_or_node__9250.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9251 === val_or_node__9250) {
        return inode__9237
      }else {
        return cljs.core.edit_and_set.call(null, inode__9237, edit, 2 * idx__9239 + 1, n__9251)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9249)) {
        if(val === val_or_node__9250) {
          return inode__9237
        }else {
          return cljs.core.edit_and_set.call(null, inode__9237, edit, 2 * idx__9239 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__9237, edit, 2 * idx__9239, null, 2 * idx__9239 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__9249, val_or_node__9250, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__9252 = this;
  var inode__9253 = this;
  return cljs.core.create_inode_seq.call(null, this__9252.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9254 = this;
  var inode__9255 = this;
  var bit__9256 = 1 << (hash >>> shift & 31);
  if((this__9254.bitmap & bit__9256) === 0) {
    return inode__9255
  }else {
    var idx__9257 = cljs.core.bitmap_indexed_node_index.call(null, this__9254.bitmap, bit__9256);
    var key_or_nil__9258 = this__9254.arr[2 * idx__9257];
    var val_or_node__9259 = this__9254.arr[2 * idx__9257 + 1];
    if(key_or_nil__9258 == null) {
      var n__9260 = val_or_node__9259.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__9260 === val_or_node__9259) {
        return inode__9255
      }else {
        if(!(n__9260 == null)) {
          return cljs.core.edit_and_set.call(null, inode__9255, edit, 2 * idx__9257 + 1, n__9260)
        }else {
          if(this__9254.bitmap === bit__9256) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__9255.edit_and_remove_pair(edit, bit__9256, idx__9257)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9258)) {
        removed_leaf_QMARK_[0] = true;
        return inode__9255.edit_and_remove_pair(edit, bit__9256, idx__9257)
      }else {
        if("\ufdd0'else") {
          return inode__9255
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__9261 = this;
  var inode__9262 = this;
  if(e === this__9261.edit) {
    return inode__9262
  }else {
    var n__9263 = cljs.core.bit_count.call(null, this__9261.bitmap);
    var new_arr__9264 = cljs.core.make_array.call(null, n__9263 < 0 ? 4 : 2 * (n__9263 + 1));
    cljs.core.array_copy.call(null, this__9261.arr, 0, new_arr__9264, 0, 2 * n__9263);
    return new cljs.core.BitmapIndexedNode(e, this__9261.bitmap, new_arr__9264)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__9265 = this;
  var inode__9266 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9265.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9267 = this;
  var inode__9268 = this;
  var bit__9269 = 1 << (hash >>> shift & 31);
  if((this__9267.bitmap & bit__9269) === 0) {
    return not_found
  }else {
    var idx__9270 = cljs.core.bitmap_indexed_node_index.call(null, this__9267.bitmap, bit__9269);
    var key_or_nil__9271 = this__9267.arr[2 * idx__9270];
    var val_or_node__9272 = this__9267.arr[2 * idx__9270 + 1];
    if(key_or_nil__9271 == null) {
      return val_or_node__9272.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9271)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__9271, val_or_node__9272], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__9273 = this;
  var inode__9274 = this;
  var bit__9275 = 1 << (hash >>> shift & 31);
  if((this__9273.bitmap & bit__9275) === 0) {
    return inode__9274
  }else {
    var idx__9276 = cljs.core.bitmap_indexed_node_index.call(null, this__9273.bitmap, bit__9275);
    var key_or_nil__9277 = this__9273.arr[2 * idx__9276];
    var val_or_node__9278 = this__9273.arr[2 * idx__9276 + 1];
    if(key_or_nil__9277 == null) {
      var n__9279 = val_or_node__9278.inode_without(shift + 5, hash, key);
      if(n__9279 === val_or_node__9278) {
        return inode__9274
      }else {
        if(!(n__9279 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__9273.bitmap, cljs.core.clone_and_set.call(null, this__9273.arr, 2 * idx__9276 + 1, n__9279))
        }else {
          if(this__9273.bitmap === bit__9275) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__9273.bitmap ^ bit__9275, cljs.core.remove_pair.call(null, this__9273.arr, idx__9276))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9277)) {
        return new cljs.core.BitmapIndexedNode(null, this__9273.bitmap ^ bit__9275, cljs.core.remove_pair.call(null, this__9273.arr, idx__9276))
      }else {
        if("\ufdd0'else") {
          return inode__9274
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9280 = this;
  var inode__9281 = this;
  var bit__9282 = 1 << (hash >>> shift & 31);
  var idx__9283 = cljs.core.bitmap_indexed_node_index.call(null, this__9280.bitmap, bit__9282);
  if((this__9280.bitmap & bit__9282) === 0) {
    var n__9284 = cljs.core.bit_count.call(null, this__9280.bitmap);
    if(n__9284 >= 16) {
      var nodes__9285 = cljs.core.make_array.call(null, 32);
      var jdx__9286 = hash >>> shift & 31;
      nodes__9285[jdx__9286] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__9287 = 0;
      var j__9288 = 0;
      while(true) {
        if(i__9287 < 32) {
          if((this__9280.bitmap >>> i__9287 & 1) === 0) {
            var G__9303 = i__9287 + 1;
            var G__9304 = j__9288;
            i__9287 = G__9303;
            j__9288 = G__9304;
            continue
          }else {
            nodes__9285[i__9287] = !(this__9280.arr[j__9288] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__9280.arr[j__9288]), this__9280.arr[j__9288], this__9280.arr[j__9288 + 1], added_leaf_QMARK_) : this__9280.arr[j__9288 + 1];
            var G__9305 = i__9287 + 1;
            var G__9306 = j__9288 + 2;
            i__9287 = G__9305;
            j__9288 = G__9306;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__9284 + 1, nodes__9285)
    }else {
      var new_arr__9289 = cljs.core.make_array.call(null, 2 * (n__9284 + 1));
      cljs.core.array_copy.call(null, this__9280.arr, 0, new_arr__9289, 0, 2 * idx__9283);
      new_arr__9289[2 * idx__9283] = key;
      new_arr__9289[2 * idx__9283 + 1] = val;
      cljs.core.array_copy.call(null, this__9280.arr, 2 * idx__9283, new_arr__9289, 2 * (idx__9283 + 1), 2 * (n__9284 - idx__9283));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__9280.bitmap | bit__9282, new_arr__9289)
    }
  }else {
    var key_or_nil__9290 = this__9280.arr[2 * idx__9283];
    var val_or_node__9291 = this__9280.arr[2 * idx__9283 + 1];
    if(key_or_nil__9290 == null) {
      var n__9292 = val_or_node__9291.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9292 === val_or_node__9291) {
        return inode__9281
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__9280.bitmap, cljs.core.clone_and_set.call(null, this__9280.arr, 2 * idx__9283 + 1, n__9292))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9290)) {
        if(val === val_or_node__9291) {
          return inode__9281
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__9280.bitmap, cljs.core.clone_and_set.call(null, this__9280.arr, 2 * idx__9283 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__9280.bitmap, cljs.core.clone_and_set.call(null, this__9280.arr, 2 * idx__9283, null, 2 * idx__9283 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__9290, val_or_node__9291, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9293 = this;
  var inode__9294 = this;
  var bit__9295 = 1 << (hash >>> shift & 31);
  if((this__9293.bitmap & bit__9295) === 0) {
    return not_found
  }else {
    var idx__9296 = cljs.core.bitmap_indexed_node_index.call(null, this__9293.bitmap, bit__9295);
    var key_or_nil__9297 = this__9293.arr[2 * idx__9296];
    var val_or_node__9298 = this__9293.arr[2 * idx__9296 + 1];
    if(key_or_nil__9297 == null) {
      return val_or_node__9298.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9297)) {
        return val_or_node__9298
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__9314 = array_node.arr;
  var len__9315 = 2 * (array_node.cnt - 1);
  var new_arr__9316 = cljs.core.make_array.call(null, len__9315);
  var i__9317 = 0;
  var j__9318 = 1;
  var bitmap__9319 = 0;
  while(true) {
    if(i__9317 < len__9315) {
      if(function() {
        var and__3822__auto____9320 = !(i__9317 === idx);
        if(and__3822__auto____9320) {
          return!(arr__9314[i__9317] == null)
        }else {
          return and__3822__auto____9320
        }
      }()) {
        new_arr__9316[j__9318] = arr__9314[i__9317];
        var G__9321 = i__9317 + 1;
        var G__9322 = j__9318 + 2;
        var G__9323 = bitmap__9319 | 1 << i__9317;
        i__9317 = G__9321;
        j__9318 = G__9322;
        bitmap__9319 = G__9323;
        continue
      }else {
        var G__9324 = i__9317 + 1;
        var G__9325 = j__9318;
        var G__9326 = bitmap__9319;
        i__9317 = G__9324;
        j__9318 = G__9325;
        bitmap__9319 = G__9326;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__9319, new_arr__9316)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9327 = this;
  var inode__9328 = this;
  var idx__9329 = hash >>> shift & 31;
  var node__9330 = this__9327.arr[idx__9329];
  if(node__9330 == null) {
    var editable__9331 = cljs.core.edit_and_set.call(null, inode__9328, edit, idx__9329, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__9331.cnt = editable__9331.cnt + 1;
    return editable__9331
  }else {
    var n__9332 = node__9330.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9332 === node__9330) {
      return inode__9328
    }else {
      return cljs.core.edit_and_set.call(null, inode__9328, edit, idx__9329, n__9332)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__9333 = this;
  var inode__9334 = this;
  return cljs.core.create_array_node_seq.call(null, this__9333.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9335 = this;
  var inode__9336 = this;
  var idx__9337 = hash >>> shift & 31;
  var node__9338 = this__9335.arr[idx__9337];
  if(node__9338 == null) {
    return inode__9336
  }else {
    var n__9339 = node__9338.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__9339 === node__9338) {
      return inode__9336
    }else {
      if(n__9339 == null) {
        if(this__9335.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9336, edit, idx__9337)
        }else {
          var editable__9340 = cljs.core.edit_and_set.call(null, inode__9336, edit, idx__9337, n__9339);
          editable__9340.cnt = editable__9340.cnt - 1;
          return editable__9340
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__9336, edit, idx__9337, n__9339)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__9341 = this;
  var inode__9342 = this;
  if(e === this__9341.edit) {
    return inode__9342
  }else {
    return new cljs.core.ArrayNode(e, this__9341.cnt, this__9341.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__9343 = this;
  var inode__9344 = this;
  var len__9345 = this__9343.arr.length;
  var i__9346 = 0;
  var init__9347 = init;
  while(true) {
    if(i__9346 < len__9345) {
      var node__9348 = this__9343.arr[i__9346];
      if(!(node__9348 == null)) {
        var init__9349 = node__9348.kv_reduce(f, init__9347);
        if(cljs.core.reduced_QMARK_.call(null, init__9349)) {
          return cljs.core.deref.call(null, init__9349)
        }else {
          var G__9368 = i__9346 + 1;
          var G__9369 = init__9349;
          i__9346 = G__9368;
          init__9347 = G__9369;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__9347
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9350 = this;
  var inode__9351 = this;
  var idx__9352 = hash >>> shift & 31;
  var node__9353 = this__9350.arr[idx__9352];
  if(!(node__9353 == null)) {
    return node__9353.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__9354 = this;
  var inode__9355 = this;
  var idx__9356 = hash >>> shift & 31;
  var node__9357 = this__9354.arr[idx__9356];
  if(!(node__9357 == null)) {
    var n__9358 = node__9357.inode_without(shift + 5, hash, key);
    if(n__9358 === node__9357) {
      return inode__9355
    }else {
      if(n__9358 == null) {
        if(this__9354.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9355, null, idx__9356)
        }else {
          return new cljs.core.ArrayNode(null, this__9354.cnt - 1, cljs.core.clone_and_set.call(null, this__9354.arr, idx__9356, n__9358))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__9354.cnt, cljs.core.clone_and_set.call(null, this__9354.arr, idx__9356, n__9358))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__9355
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9359 = this;
  var inode__9360 = this;
  var idx__9361 = hash >>> shift & 31;
  var node__9362 = this__9359.arr[idx__9361];
  if(node__9362 == null) {
    return new cljs.core.ArrayNode(null, this__9359.cnt + 1, cljs.core.clone_and_set.call(null, this__9359.arr, idx__9361, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__9363 = node__9362.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9363 === node__9362) {
      return inode__9360
    }else {
      return new cljs.core.ArrayNode(null, this__9359.cnt, cljs.core.clone_and_set.call(null, this__9359.arr, idx__9361, n__9363))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9364 = this;
  var inode__9365 = this;
  var idx__9366 = hash >>> shift & 31;
  var node__9367 = this__9364.arr[idx__9366];
  if(!(node__9367 == null)) {
    return node__9367.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__9372 = 2 * cnt;
  var i__9373 = 0;
  while(true) {
    if(i__9373 < lim__9372) {
      if(cljs.core.key_test.call(null, key, arr[i__9373])) {
        return i__9373
      }else {
        var G__9374 = i__9373 + 2;
        i__9373 = G__9374;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9375 = this;
  var inode__9376 = this;
  if(hash === this__9375.collision_hash) {
    var idx__9377 = cljs.core.hash_collision_node_find_index.call(null, this__9375.arr, this__9375.cnt, key);
    if(idx__9377 === -1) {
      if(this__9375.arr.length > 2 * this__9375.cnt) {
        var editable__9378 = cljs.core.edit_and_set.call(null, inode__9376, edit, 2 * this__9375.cnt, key, 2 * this__9375.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__9378.cnt = editable__9378.cnt + 1;
        return editable__9378
      }else {
        var len__9379 = this__9375.arr.length;
        var new_arr__9380 = cljs.core.make_array.call(null, len__9379 + 2);
        cljs.core.array_copy.call(null, this__9375.arr, 0, new_arr__9380, 0, len__9379);
        new_arr__9380[len__9379] = key;
        new_arr__9380[len__9379 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__9376.ensure_editable_array(edit, this__9375.cnt + 1, new_arr__9380)
      }
    }else {
      if(this__9375.arr[idx__9377 + 1] === val) {
        return inode__9376
      }else {
        return cljs.core.edit_and_set.call(null, inode__9376, edit, idx__9377 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__9375.collision_hash >>> shift & 31), [null, inode__9376, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__9381 = this;
  var inode__9382 = this;
  return cljs.core.create_inode_seq.call(null, this__9381.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9383 = this;
  var inode__9384 = this;
  var idx__9385 = cljs.core.hash_collision_node_find_index.call(null, this__9383.arr, this__9383.cnt, key);
  if(idx__9385 === -1) {
    return inode__9384
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__9383.cnt === 1) {
      return null
    }else {
      var editable__9386 = inode__9384.ensure_editable(edit);
      var earr__9387 = editable__9386.arr;
      earr__9387[idx__9385] = earr__9387[2 * this__9383.cnt - 2];
      earr__9387[idx__9385 + 1] = earr__9387[2 * this__9383.cnt - 1];
      earr__9387[2 * this__9383.cnt - 1] = null;
      earr__9387[2 * this__9383.cnt - 2] = null;
      editable__9386.cnt = editable__9386.cnt - 1;
      return editable__9386
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__9388 = this;
  var inode__9389 = this;
  if(e === this__9388.edit) {
    return inode__9389
  }else {
    var new_arr__9390 = cljs.core.make_array.call(null, 2 * (this__9388.cnt + 1));
    cljs.core.array_copy.call(null, this__9388.arr, 0, new_arr__9390, 0, 2 * this__9388.cnt);
    return new cljs.core.HashCollisionNode(e, this__9388.collision_hash, this__9388.cnt, new_arr__9390)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__9391 = this;
  var inode__9392 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9391.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9393 = this;
  var inode__9394 = this;
  var idx__9395 = cljs.core.hash_collision_node_find_index.call(null, this__9393.arr, this__9393.cnt, key);
  if(idx__9395 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9393.arr[idx__9395])) {
      return cljs.core.PersistentVector.fromArray([this__9393.arr[idx__9395], this__9393.arr[idx__9395 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__9396 = this;
  var inode__9397 = this;
  var idx__9398 = cljs.core.hash_collision_node_find_index.call(null, this__9396.arr, this__9396.cnt, key);
  if(idx__9398 === -1) {
    return inode__9397
  }else {
    if(this__9396.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__9396.collision_hash, this__9396.cnt - 1, cljs.core.remove_pair.call(null, this__9396.arr, cljs.core.quot.call(null, idx__9398, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9399 = this;
  var inode__9400 = this;
  if(hash === this__9399.collision_hash) {
    var idx__9401 = cljs.core.hash_collision_node_find_index.call(null, this__9399.arr, this__9399.cnt, key);
    if(idx__9401 === -1) {
      var len__9402 = this__9399.arr.length;
      var new_arr__9403 = cljs.core.make_array.call(null, len__9402 + 2);
      cljs.core.array_copy.call(null, this__9399.arr, 0, new_arr__9403, 0, len__9402);
      new_arr__9403[len__9402] = key;
      new_arr__9403[len__9402 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__9399.collision_hash, this__9399.cnt + 1, new_arr__9403)
    }else {
      if(cljs.core._EQ_.call(null, this__9399.arr[idx__9401], val)) {
        return inode__9400
      }else {
        return new cljs.core.HashCollisionNode(null, this__9399.collision_hash, this__9399.cnt, cljs.core.clone_and_set.call(null, this__9399.arr, idx__9401 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__9399.collision_hash >>> shift & 31), [null, inode__9400])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9404 = this;
  var inode__9405 = this;
  var idx__9406 = cljs.core.hash_collision_node_find_index.call(null, this__9404.arr, this__9404.cnt, key);
  if(idx__9406 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9404.arr[idx__9406])) {
      return this__9404.arr[idx__9406 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__9407 = this;
  var inode__9408 = this;
  if(e === this__9407.edit) {
    this__9407.arr = array;
    this__9407.cnt = count;
    return inode__9408
  }else {
    return new cljs.core.HashCollisionNode(this__9407.edit, this__9407.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9413 = cljs.core.hash.call(null, key1);
    if(key1hash__9413 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9413, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9414 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__9413, key1, val1, added_leaf_QMARK___9414).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___9414)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9415 = cljs.core.hash.call(null, key1);
    if(key1hash__9415 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9415, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9416 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__9415, key1, val1, added_leaf_QMARK___9416).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___9416)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9417 = this;
  var h__2247__auto____9418 = this__9417.__hash;
  if(!(h__2247__auto____9418 == null)) {
    return h__2247__auto____9418
  }else {
    var h__2247__auto____9419 = cljs.core.hash_coll.call(null, coll);
    this__9417.__hash = h__2247__auto____9419;
    return h__2247__auto____9419
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9420 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__9421 = this;
  var this__9422 = this;
  return cljs.core.pr_str.call(null, this__9422)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9423 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9424 = this;
  if(this__9424.s == null) {
    return cljs.core.PersistentVector.fromArray([this__9424.nodes[this__9424.i], this__9424.nodes[this__9424.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__9424.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9425 = this;
  if(this__9425.s == null) {
    return cljs.core.create_inode_seq.call(null, this__9425.nodes, this__9425.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__9425.nodes, this__9425.i, cljs.core.next.call(null, this__9425.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9426 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9427 = this;
  return new cljs.core.NodeSeq(meta, this__9427.nodes, this__9427.i, this__9427.s, this__9427.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9428 = this;
  return this__9428.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9429 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9429.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__9436 = nodes.length;
      var j__9437 = i;
      while(true) {
        if(j__9437 < len__9436) {
          if(!(nodes[j__9437] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__9437, null, null)
          }else {
            var temp__3971__auto____9438 = nodes[j__9437 + 1];
            if(cljs.core.truth_(temp__3971__auto____9438)) {
              var node__9439 = temp__3971__auto____9438;
              var temp__3971__auto____9440 = node__9439.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____9440)) {
                var node_seq__9441 = temp__3971__auto____9440;
                return new cljs.core.NodeSeq(null, nodes, j__9437 + 2, node_seq__9441, null)
              }else {
                var G__9442 = j__9437 + 2;
                j__9437 = G__9442;
                continue
              }
            }else {
              var G__9443 = j__9437 + 2;
              j__9437 = G__9443;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9444 = this;
  var h__2247__auto____9445 = this__9444.__hash;
  if(!(h__2247__auto____9445 == null)) {
    return h__2247__auto____9445
  }else {
    var h__2247__auto____9446 = cljs.core.hash_coll.call(null, coll);
    this__9444.__hash = h__2247__auto____9446;
    return h__2247__auto____9446
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9447 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__9448 = this;
  var this__9449 = this;
  return cljs.core.pr_str.call(null, this__9449)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9450 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9451 = this;
  return cljs.core.first.call(null, this__9451.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9452 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__9452.nodes, this__9452.i, cljs.core.next.call(null, this__9452.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9453 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9454 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__9454.nodes, this__9454.i, this__9454.s, this__9454.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9455 = this;
  return this__9455.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9456 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9456.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__9463 = nodes.length;
      var j__9464 = i;
      while(true) {
        if(j__9464 < len__9463) {
          var temp__3971__auto____9465 = nodes[j__9464];
          if(cljs.core.truth_(temp__3971__auto____9465)) {
            var nj__9466 = temp__3971__auto____9465;
            var temp__3971__auto____9467 = nj__9466.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____9467)) {
              var ns__9468 = temp__3971__auto____9467;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__9464 + 1, ns__9468, null)
            }else {
              var G__9469 = j__9464 + 1;
              j__9464 = G__9469;
              continue
            }
          }else {
            var G__9470 = j__9464 + 1;
            j__9464 = G__9470;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9473 = this;
  return new cljs.core.TransientHashMap({}, this__9473.root, this__9473.cnt, this__9473.has_nil_QMARK_, this__9473.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9474 = this;
  var h__2247__auto____9475 = this__9474.__hash;
  if(!(h__2247__auto____9475 == null)) {
    return h__2247__auto____9475
  }else {
    var h__2247__auto____9476 = cljs.core.hash_imap.call(null, coll);
    this__9474.__hash = h__2247__auto____9476;
    return h__2247__auto____9476
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9477 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9478 = this;
  if(k == null) {
    if(this__9478.has_nil_QMARK_) {
      return this__9478.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9478.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__9478.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9479 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____9480 = this__9479.has_nil_QMARK_;
      if(and__3822__auto____9480) {
        return v === this__9479.nil_val
      }else {
        return and__3822__auto____9480
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9479.meta, this__9479.has_nil_QMARK_ ? this__9479.cnt : this__9479.cnt + 1, this__9479.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___9481 = new cljs.core.Box(false);
    var new_root__9482 = (this__9479.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9479.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9481);
    if(new_root__9482 === this__9479.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9479.meta, added_leaf_QMARK___9481.val ? this__9479.cnt + 1 : this__9479.cnt, new_root__9482, this__9479.has_nil_QMARK_, this__9479.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9483 = this;
  if(k == null) {
    return this__9483.has_nil_QMARK_
  }else {
    if(this__9483.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__9483.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9506 = null;
  var G__9506__2 = function(this_sym9484, k) {
    var this__9486 = this;
    var this_sym9484__9487 = this;
    var coll__9488 = this_sym9484__9487;
    return coll__9488.cljs$core$ILookup$_lookup$arity$2(coll__9488, k)
  };
  var G__9506__3 = function(this_sym9485, k, not_found) {
    var this__9486 = this;
    var this_sym9485__9489 = this;
    var coll__9490 = this_sym9485__9489;
    return coll__9490.cljs$core$ILookup$_lookup$arity$3(coll__9490, k, not_found)
  };
  G__9506 = function(this_sym9485, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9506__2.call(this, this_sym9485, k);
      case 3:
        return G__9506__3.call(this, this_sym9485, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9506
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym9471, args9472) {
  var this__9491 = this;
  return this_sym9471.call.apply(this_sym9471, [this_sym9471].concat(args9472.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9492 = this;
  var init__9493 = this__9492.has_nil_QMARK_ ? f.call(null, init, null, this__9492.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9493)) {
    return cljs.core.deref.call(null, init__9493)
  }else {
    if(!(this__9492.root == null)) {
      return this__9492.root.kv_reduce(f, init__9493)
    }else {
      if("\ufdd0'else") {
        return init__9493
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9494 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9495 = this;
  var this__9496 = this;
  return cljs.core.pr_str.call(null, this__9496)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9497 = this;
  if(this__9497.cnt > 0) {
    var s__9498 = !(this__9497.root == null) ? this__9497.root.inode_seq() : null;
    if(this__9497.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9497.nil_val], true), s__9498)
    }else {
      return s__9498
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9499 = this;
  return this__9499.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9500 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9501 = this;
  return new cljs.core.PersistentHashMap(meta, this__9501.cnt, this__9501.root, this__9501.has_nil_QMARK_, this__9501.nil_val, this__9501.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9502 = this;
  return this__9502.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9503 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9503.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9504 = this;
  if(k == null) {
    if(this__9504.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9504.meta, this__9504.cnt - 1, this__9504.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9504.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9505 = this__9504.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9505 === this__9504.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9504.meta, this__9504.cnt - 1, new_root__9505, this__9504.has_nil_QMARK_, this__9504.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__9507 = ks.length;
  var i__9508 = 0;
  var out__9509 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9508 < len__9507) {
      var G__9510 = i__9508 + 1;
      var G__9511 = cljs.core.assoc_BANG_.call(null, out__9509, ks[i__9508], vs[i__9508]);
      i__9508 = G__9510;
      out__9509 = G__9511;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9509)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9512 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9513 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9514 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9515 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9516 = this;
  if(k == null) {
    if(this__9516.has_nil_QMARK_) {
      return this__9516.nil_val
    }else {
      return null
    }
  }else {
    if(this__9516.root == null) {
      return null
    }else {
      return this__9516.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9517 = this;
  if(k == null) {
    if(this__9517.has_nil_QMARK_) {
      return this__9517.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9517.root == null) {
      return not_found
    }else {
      return this__9517.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9518 = this;
  if(this__9518.edit) {
    return this__9518.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9519 = this;
  var tcoll__9520 = this;
  if(this__9519.edit) {
    if(function() {
      var G__9521__9522 = o;
      if(G__9521__9522) {
        if(function() {
          var or__3824__auto____9523 = G__9521__9522.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9523) {
            return or__3824__auto____9523
          }else {
            return G__9521__9522.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9521__9522.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9521__9522)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9521__9522)
      }
    }()) {
      return tcoll__9520.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9524 = cljs.core.seq.call(null, o);
      var tcoll__9525 = tcoll__9520;
      while(true) {
        var temp__3971__auto____9526 = cljs.core.first.call(null, es__9524);
        if(cljs.core.truth_(temp__3971__auto____9526)) {
          var e__9527 = temp__3971__auto____9526;
          var G__9538 = cljs.core.next.call(null, es__9524);
          var G__9539 = tcoll__9525.assoc_BANG_(cljs.core.key.call(null, e__9527), cljs.core.val.call(null, e__9527));
          es__9524 = G__9538;
          tcoll__9525 = G__9539;
          continue
        }else {
          return tcoll__9525
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9528 = this;
  var tcoll__9529 = this;
  if(this__9528.edit) {
    if(k == null) {
      if(this__9528.nil_val === v) {
      }else {
        this__9528.nil_val = v
      }
      if(this__9528.has_nil_QMARK_) {
      }else {
        this__9528.count = this__9528.count + 1;
        this__9528.has_nil_QMARK_ = true
      }
      return tcoll__9529
    }else {
      var added_leaf_QMARK___9530 = new cljs.core.Box(false);
      var node__9531 = (this__9528.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9528.root).inode_assoc_BANG_(this__9528.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9530);
      if(node__9531 === this__9528.root) {
      }else {
        this__9528.root = node__9531
      }
      if(added_leaf_QMARK___9530.val) {
        this__9528.count = this__9528.count + 1
      }else {
      }
      return tcoll__9529
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9532 = this;
  var tcoll__9533 = this;
  if(this__9532.edit) {
    if(k == null) {
      if(this__9532.has_nil_QMARK_) {
        this__9532.has_nil_QMARK_ = false;
        this__9532.nil_val = null;
        this__9532.count = this__9532.count - 1;
        return tcoll__9533
      }else {
        return tcoll__9533
      }
    }else {
      if(this__9532.root == null) {
        return tcoll__9533
      }else {
        var removed_leaf_QMARK___9534 = new cljs.core.Box(false);
        var node__9535 = this__9532.root.inode_without_BANG_(this__9532.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9534);
        if(node__9535 === this__9532.root) {
        }else {
          this__9532.root = node__9535
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9534[0])) {
          this__9532.count = this__9532.count - 1
        }else {
        }
        return tcoll__9533
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9536 = this;
  var tcoll__9537 = this;
  if(this__9536.edit) {
    this__9536.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9536.count, this__9536.root, this__9536.has_nil_QMARK_, this__9536.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9542 = node;
  var stack__9543 = stack;
  while(true) {
    if(!(t__9542 == null)) {
      var G__9544 = ascending_QMARK_ ? t__9542.left : t__9542.right;
      var G__9545 = cljs.core.conj.call(null, stack__9543, t__9542);
      t__9542 = G__9544;
      stack__9543 = G__9545;
      continue
    }else {
      return stack__9543
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9546 = this;
  var h__2247__auto____9547 = this__9546.__hash;
  if(!(h__2247__auto____9547 == null)) {
    return h__2247__auto____9547
  }else {
    var h__2247__auto____9548 = cljs.core.hash_coll.call(null, coll);
    this__9546.__hash = h__2247__auto____9548;
    return h__2247__auto____9548
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9549 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9550 = this;
  var this__9551 = this;
  return cljs.core.pr_str.call(null, this__9551)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9552 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9553 = this;
  if(this__9553.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9553.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9554 = this;
  return cljs.core.peek.call(null, this__9554.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9555 = this;
  var t__9556 = cljs.core.first.call(null, this__9555.stack);
  var next_stack__9557 = cljs.core.tree_map_seq_push.call(null, this__9555.ascending_QMARK_ ? t__9556.right : t__9556.left, cljs.core.next.call(null, this__9555.stack), this__9555.ascending_QMARK_);
  if(!(next_stack__9557 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9557, this__9555.ascending_QMARK_, this__9555.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9558 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9559 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9559.stack, this__9559.ascending_QMARK_, this__9559.cnt, this__9559.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9560 = this;
  return this__9560.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____9562 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9562) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9562
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____9564 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9564) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9564
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__9568 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9568)) {
    return cljs.core.deref.call(null, init__9568)
  }else {
    var init__9569 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9568) : init__9568;
    if(cljs.core.reduced_QMARK_.call(null, init__9569)) {
      return cljs.core.deref.call(null, init__9569)
    }else {
      var init__9570 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9569) : init__9569;
      if(cljs.core.reduced_QMARK_.call(null, init__9570)) {
        return cljs.core.deref.call(null, init__9570)
      }else {
        return init__9570
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9573 = this;
  var h__2247__auto____9574 = this__9573.__hash;
  if(!(h__2247__auto____9574 == null)) {
    return h__2247__auto____9574
  }else {
    var h__2247__auto____9575 = cljs.core.hash_coll.call(null, coll);
    this__9573.__hash = h__2247__auto____9575;
    return h__2247__auto____9575
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9576 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9577 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9578 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9578.key, this__9578.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9626 = null;
  var G__9626__2 = function(this_sym9579, k) {
    var this__9581 = this;
    var this_sym9579__9582 = this;
    var node__9583 = this_sym9579__9582;
    return node__9583.cljs$core$ILookup$_lookup$arity$2(node__9583, k)
  };
  var G__9626__3 = function(this_sym9580, k, not_found) {
    var this__9581 = this;
    var this_sym9580__9584 = this;
    var node__9585 = this_sym9580__9584;
    return node__9585.cljs$core$ILookup$_lookup$arity$3(node__9585, k, not_found)
  };
  G__9626 = function(this_sym9580, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9626__2.call(this, this_sym9580, k);
      case 3:
        return G__9626__3.call(this, this_sym9580, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9626
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9571, args9572) {
  var this__9586 = this;
  return this_sym9571.call.apply(this_sym9571, [this_sym9571].concat(args9572.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9587 = this;
  return cljs.core.PersistentVector.fromArray([this__9587.key, this__9587.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9588 = this;
  return this__9588.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9589 = this;
  return this__9589.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9590 = this;
  var node__9591 = this;
  return ins.balance_right(node__9591)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9592 = this;
  var node__9593 = this;
  return new cljs.core.RedNode(this__9592.key, this__9592.val, this__9592.left, this__9592.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9594 = this;
  var node__9595 = this;
  return cljs.core.balance_right_del.call(null, this__9594.key, this__9594.val, this__9594.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9596 = this;
  var node__9597 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9598 = this;
  var node__9599 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9599, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9600 = this;
  var node__9601 = this;
  return cljs.core.balance_left_del.call(null, this__9600.key, this__9600.val, del, this__9600.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9602 = this;
  var node__9603 = this;
  return ins.balance_left(node__9603)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9604 = this;
  var node__9605 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9605, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9627 = null;
  var G__9627__0 = function() {
    var this__9606 = this;
    var this__9608 = this;
    return cljs.core.pr_str.call(null, this__9608)
  };
  G__9627 = function() {
    switch(arguments.length) {
      case 0:
        return G__9627__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9627
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9609 = this;
  var node__9610 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9610, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9611 = this;
  var node__9612 = this;
  return node__9612
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9613 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9614 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9615 = this;
  return cljs.core.list.call(null, this__9615.key, this__9615.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9616 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9617 = this;
  return this__9617.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9618 = this;
  return cljs.core.PersistentVector.fromArray([this__9618.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9619 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9619.key, this__9619.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9620 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9621 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9621.key, this__9621.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9622 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9623 = this;
  if(n === 0) {
    return this__9623.key
  }else {
    if(n === 1) {
      return this__9623.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9624 = this;
  if(n === 0) {
    return this__9624.key
  }else {
    if(n === 1) {
      return this__9624.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9625 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9630 = this;
  var h__2247__auto____9631 = this__9630.__hash;
  if(!(h__2247__auto____9631 == null)) {
    return h__2247__auto____9631
  }else {
    var h__2247__auto____9632 = cljs.core.hash_coll.call(null, coll);
    this__9630.__hash = h__2247__auto____9632;
    return h__2247__auto____9632
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9633 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9634 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9635 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9635.key, this__9635.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9683 = null;
  var G__9683__2 = function(this_sym9636, k) {
    var this__9638 = this;
    var this_sym9636__9639 = this;
    var node__9640 = this_sym9636__9639;
    return node__9640.cljs$core$ILookup$_lookup$arity$2(node__9640, k)
  };
  var G__9683__3 = function(this_sym9637, k, not_found) {
    var this__9638 = this;
    var this_sym9637__9641 = this;
    var node__9642 = this_sym9637__9641;
    return node__9642.cljs$core$ILookup$_lookup$arity$3(node__9642, k, not_found)
  };
  G__9683 = function(this_sym9637, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9683__2.call(this, this_sym9637, k);
      case 3:
        return G__9683__3.call(this, this_sym9637, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9683
}();
cljs.core.RedNode.prototype.apply = function(this_sym9628, args9629) {
  var this__9643 = this;
  return this_sym9628.call.apply(this_sym9628, [this_sym9628].concat(args9629.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9644 = this;
  return cljs.core.PersistentVector.fromArray([this__9644.key, this__9644.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9645 = this;
  return this__9645.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9646 = this;
  return this__9646.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9647 = this;
  var node__9648 = this;
  return new cljs.core.RedNode(this__9647.key, this__9647.val, this__9647.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9649 = this;
  var node__9650 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9651 = this;
  var node__9652 = this;
  return new cljs.core.RedNode(this__9651.key, this__9651.val, this__9651.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9653 = this;
  var node__9654 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9655 = this;
  var node__9656 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9656, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9657 = this;
  var node__9658 = this;
  return new cljs.core.RedNode(this__9657.key, this__9657.val, del, this__9657.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9659 = this;
  var node__9660 = this;
  return new cljs.core.RedNode(this__9659.key, this__9659.val, ins, this__9659.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9661 = this;
  var node__9662 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9661.left)) {
    return new cljs.core.RedNode(this__9661.key, this__9661.val, this__9661.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9661.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9661.right)) {
      return new cljs.core.RedNode(this__9661.right.key, this__9661.right.val, new cljs.core.BlackNode(this__9661.key, this__9661.val, this__9661.left, this__9661.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9661.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9662, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9684 = null;
  var G__9684__0 = function() {
    var this__9663 = this;
    var this__9665 = this;
    return cljs.core.pr_str.call(null, this__9665)
  };
  G__9684 = function() {
    switch(arguments.length) {
      case 0:
        return G__9684__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9684
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9666 = this;
  var node__9667 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9666.right)) {
    return new cljs.core.RedNode(this__9666.key, this__9666.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9666.left, null), this__9666.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9666.left)) {
      return new cljs.core.RedNode(this__9666.left.key, this__9666.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9666.left.left, null), new cljs.core.BlackNode(this__9666.key, this__9666.val, this__9666.left.right, this__9666.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9667, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9668 = this;
  var node__9669 = this;
  return new cljs.core.BlackNode(this__9668.key, this__9668.val, this__9668.left, this__9668.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9670 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9671 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9672 = this;
  return cljs.core.list.call(null, this__9672.key, this__9672.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9673 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9674 = this;
  return this__9674.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9675 = this;
  return cljs.core.PersistentVector.fromArray([this__9675.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9676 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9676.key, this__9676.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9677 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9678 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9678.key, this__9678.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9679 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9680 = this;
  if(n === 0) {
    return this__9680.key
  }else {
    if(n === 1) {
      return this__9680.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9681 = this;
  if(n === 0) {
    return this__9681.key
  }else {
    if(n === 1) {
      return this__9681.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9682 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9688 = comp.call(null, k, tree.key);
    if(c__9688 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9688 < 0) {
        var ins__9689 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9689 == null)) {
          return tree.add_left(ins__9689)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9690 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9690 == null)) {
            return tree.add_right(ins__9690)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__9693 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9693)) {
            return new cljs.core.RedNode(app__9693.key, app__9693.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9693.left, null), new cljs.core.RedNode(right.key, right.val, app__9693.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9693, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9694 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9694)) {
              return new cljs.core.RedNode(app__9694.key, app__9694.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9694.left, null), new cljs.core.BlackNode(right.key, right.val, app__9694.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9694, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__9700 = comp.call(null, k, tree.key);
    if(c__9700 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9700 < 0) {
        var del__9701 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9702 = !(del__9701 == null);
          if(or__3824__auto____9702) {
            return or__3824__auto____9702
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9701, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9701, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9703 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9704 = !(del__9703 == null);
            if(or__3824__auto____9704) {
              return or__3824__auto____9704
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9703)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9703, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__9707 = tree.key;
  var c__9708 = comp.call(null, k, tk__9707);
  if(c__9708 === 0) {
    return tree.replace(tk__9707, v, tree.left, tree.right)
  }else {
    if(c__9708 < 0) {
      return tree.replace(tk__9707, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9707, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9711 = this;
  var h__2247__auto____9712 = this__9711.__hash;
  if(!(h__2247__auto____9712 == null)) {
    return h__2247__auto____9712
  }else {
    var h__2247__auto____9713 = cljs.core.hash_imap.call(null, coll);
    this__9711.__hash = h__2247__auto____9713;
    return h__2247__auto____9713
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9714 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9715 = this;
  var n__9716 = coll.entry_at(k);
  if(!(n__9716 == null)) {
    return n__9716.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9717 = this;
  var found__9718 = [null];
  var t__9719 = cljs.core.tree_map_add.call(null, this__9717.comp, this__9717.tree, k, v, found__9718);
  if(t__9719 == null) {
    var found_node__9720 = cljs.core.nth.call(null, found__9718, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9720.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9717.comp, cljs.core.tree_map_replace.call(null, this__9717.comp, this__9717.tree, k, v), this__9717.cnt, this__9717.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9717.comp, t__9719.blacken(), this__9717.cnt + 1, this__9717.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9721 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9755 = null;
  var G__9755__2 = function(this_sym9722, k) {
    var this__9724 = this;
    var this_sym9722__9725 = this;
    var coll__9726 = this_sym9722__9725;
    return coll__9726.cljs$core$ILookup$_lookup$arity$2(coll__9726, k)
  };
  var G__9755__3 = function(this_sym9723, k, not_found) {
    var this__9724 = this;
    var this_sym9723__9727 = this;
    var coll__9728 = this_sym9723__9727;
    return coll__9728.cljs$core$ILookup$_lookup$arity$3(coll__9728, k, not_found)
  };
  G__9755 = function(this_sym9723, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9755__2.call(this, this_sym9723, k);
      case 3:
        return G__9755__3.call(this, this_sym9723, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9755
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9709, args9710) {
  var this__9729 = this;
  return this_sym9709.call.apply(this_sym9709, [this_sym9709].concat(args9710.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9730 = this;
  if(!(this__9730.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9730.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9731 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9732 = this;
  if(this__9732.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9732.tree, false, this__9732.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9733 = this;
  var this__9734 = this;
  return cljs.core.pr_str.call(null, this__9734)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9735 = this;
  var coll__9736 = this;
  var t__9737 = this__9735.tree;
  while(true) {
    if(!(t__9737 == null)) {
      var c__9738 = this__9735.comp.call(null, k, t__9737.key);
      if(c__9738 === 0) {
        return t__9737
      }else {
        if(c__9738 < 0) {
          var G__9756 = t__9737.left;
          t__9737 = G__9756;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9757 = t__9737.right;
            t__9737 = G__9757;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9739 = this;
  if(this__9739.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9739.tree, ascending_QMARK_, this__9739.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9740 = this;
  if(this__9740.cnt > 0) {
    var stack__9741 = null;
    var t__9742 = this__9740.tree;
    while(true) {
      if(!(t__9742 == null)) {
        var c__9743 = this__9740.comp.call(null, k, t__9742.key);
        if(c__9743 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9741, t__9742), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9743 < 0) {
              var G__9758 = cljs.core.conj.call(null, stack__9741, t__9742);
              var G__9759 = t__9742.left;
              stack__9741 = G__9758;
              t__9742 = G__9759;
              continue
            }else {
              var G__9760 = stack__9741;
              var G__9761 = t__9742.right;
              stack__9741 = G__9760;
              t__9742 = G__9761;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9743 > 0) {
                var G__9762 = cljs.core.conj.call(null, stack__9741, t__9742);
                var G__9763 = t__9742.right;
                stack__9741 = G__9762;
                t__9742 = G__9763;
                continue
              }else {
                var G__9764 = stack__9741;
                var G__9765 = t__9742.left;
                stack__9741 = G__9764;
                t__9742 = G__9765;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9741 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9741, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9744 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9745 = this;
  return this__9745.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9746 = this;
  if(this__9746.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9746.tree, true, this__9746.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9747 = this;
  return this__9747.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9748 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9749 = this;
  return new cljs.core.PersistentTreeMap(this__9749.comp, this__9749.tree, this__9749.cnt, meta, this__9749.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9750 = this;
  return this__9750.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9751 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9751.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9752 = this;
  var found__9753 = [null];
  var t__9754 = cljs.core.tree_map_remove.call(null, this__9752.comp, this__9752.tree, k, found__9753);
  if(t__9754 == null) {
    if(cljs.core.nth.call(null, found__9753, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9752.comp, null, 0, this__9752.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9752.comp, t__9754.blacken(), this__9752.cnt - 1, this__9752.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9768 = cljs.core.seq.call(null, keyvals);
    var out__9769 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9768) {
        var G__9770 = cljs.core.nnext.call(null, in__9768);
        var G__9771 = cljs.core.assoc_BANG_.call(null, out__9769, cljs.core.first.call(null, in__9768), cljs.core.second.call(null, in__9768));
        in__9768 = G__9770;
        out__9769 = G__9771;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9769)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__9772) {
    var keyvals = cljs.core.seq(arglist__9772);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__9773) {
    var keyvals = cljs.core.seq(arglist__9773);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9777 = [];
    var obj__9778 = {};
    var kvs__9779 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9779) {
        ks__9777.push(cljs.core.first.call(null, kvs__9779));
        obj__9778[cljs.core.first.call(null, kvs__9779)] = cljs.core.second.call(null, kvs__9779);
        var G__9780 = cljs.core.nnext.call(null, kvs__9779);
        kvs__9779 = G__9780;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9777, obj__9778)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__9781) {
    var keyvals = cljs.core.seq(arglist__9781);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9784 = cljs.core.seq.call(null, keyvals);
    var out__9785 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9784) {
        var G__9786 = cljs.core.nnext.call(null, in__9784);
        var G__9787 = cljs.core.assoc.call(null, out__9785, cljs.core.first.call(null, in__9784), cljs.core.second.call(null, in__9784));
        in__9784 = G__9786;
        out__9785 = G__9787;
        continue
      }else {
        return out__9785
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__9788) {
    var keyvals = cljs.core.seq(arglist__9788);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9791 = cljs.core.seq.call(null, keyvals);
    var out__9792 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9791) {
        var G__9793 = cljs.core.nnext.call(null, in__9791);
        var G__9794 = cljs.core.assoc.call(null, out__9792, cljs.core.first.call(null, in__9791), cljs.core.second.call(null, in__9791));
        in__9791 = G__9793;
        out__9792 = G__9794;
        continue
      }else {
        return out__9792
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__9795) {
    var comparator = cljs.core.first(arglist__9795);
    var keyvals = cljs.core.rest(arglist__9795);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__9796_SHARP_, p2__9797_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9799 = p1__9796_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9799)) {
            return or__3824__auto____9799
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9797_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__9800) {
    var maps = cljs.core.seq(arglist__9800);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9808 = function(m, e) {
        var k__9806 = cljs.core.first.call(null, e);
        var v__9807 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9806)) {
          return cljs.core.assoc.call(null, m, k__9806, f.call(null, cljs.core._lookup.call(null, m, k__9806, null), v__9807))
        }else {
          return cljs.core.assoc.call(null, m, k__9806, v__9807)
        }
      };
      var merge2__9810 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9808, function() {
          var or__3824__auto____9809 = m1;
          if(cljs.core.truth_(or__3824__auto____9809)) {
            return or__3824__auto____9809
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9810, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__9811) {
    var f = cljs.core.first(arglist__9811);
    var maps = cljs.core.rest(arglist__9811);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9816 = cljs.core.ObjMap.EMPTY;
  var keys__9817 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9817) {
      var key__9818 = cljs.core.first.call(null, keys__9817);
      var entry__9819 = cljs.core._lookup.call(null, map, key__9818, "\ufdd0'cljs.core/not-found");
      var G__9820 = cljs.core.not_EQ_.call(null, entry__9819, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__9816, key__9818, entry__9819) : ret__9816;
      var G__9821 = cljs.core.next.call(null, keys__9817);
      ret__9816 = G__9820;
      keys__9817 = G__9821;
      continue
    }else {
      return ret__9816
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9825 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9825.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9826 = this;
  var h__2247__auto____9827 = this__9826.__hash;
  if(!(h__2247__auto____9827 == null)) {
    return h__2247__auto____9827
  }else {
    var h__2247__auto____9828 = cljs.core.hash_iset.call(null, coll);
    this__9826.__hash = h__2247__auto____9828;
    return h__2247__auto____9828
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9829 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9830 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9830.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9851 = null;
  var G__9851__2 = function(this_sym9831, k) {
    var this__9833 = this;
    var this_sym9831__9834 = this;
    var coll__9835 = this_sym9831__9834;
    return coll__9835.cljs$core$ILookup$_lookup$arity$2(coll__9835, k)
  };
  var G__9851__3 = function(this_sym9832, k, not_found) {
    var this__9833 = this;
    var this_sym9832__9836 = this;
    var coll__9837 = this_sym9832__9836;
    return coll__9837.cljs$core$ILookup$_lookup$arity$3(coll__9837, k, not_found)
  };
  G__9851 = function(this_sym9832, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9851__2.call(this, this_sym9832, k);
      case 3:
        return G__9851__3.call(this, this_sym9832, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9851
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9823, args9824) {
  var this__9838 = this;
  return this_sym9823.call.apply(this_sym9823, [this_sym9823].concat(args9824.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9839 = this;
  return new cljs.core.PersistentHashSet(this__9839.meta, cljs.core.assoc.call(null, this__9839.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9840 = this;
  var this__9841 = this;
  return cljs.core.pr_str.call(null, this__9841)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9842 = this;
  return cljs.core.keys.call(null, this__9842.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9843 = this;
  return new cljs.core.PersistentHashSet(this__9843.meta, cljs.core.dissoc.call(null, this__9843.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9844 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9845 = this;
  var and__3822__auto____9846 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9846) {
    var and__3822__auto____9847 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9847) {
      return cljs.core.every_QMARK_.call(null, function(p1__9822_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9822_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9847
    }
  }else {
    return and__3822__auto____9846
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9848 = this;
  return new cljs.core.PersistentHashSet(meta, this__9848.hash_map, this__9848.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9849 = this;
  return this__9849.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9850 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9850.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9852 = cljs.core.count.call(null, items);
  var i__9853 = 0;
  var out__9854 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9853 < len__9852) {
      var G__9855 = i__9853 + 1;
      var G__9856 = cljs.core.conj_BANG_.call(null, out__9854, items[i__9853]);
      i__9853 = G__9855;
      out__9854 = G__9856;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9854)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__9874 = null;
  var G__9874__2 = function(this_sym9860, k) {
    var this__9862 = this;
    var this_sym9860__9863 = this;
    var tcoll__9864 = this_sym9860__9863;
    if(cljs.core._lookup.call(null, this__9862.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9874__3 = function(this_sym9861, k, not_found) {
    var this__9862 = this;
    var this_sym9861__9865 = this;
    var tcoll__9866 = this_sym9861__9865;
    if(cljs.core._lookup.call(null, this__9862.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9874 = function(this_sym9861, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9874__2.call(this, this_sym9861, k);
      case 3:
        return G__9874__3.call(this, this_sym9861, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9874
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9858, args9859) {
  var this__9867 = this;
  return this_sym9858.call.apply(this_sym9858, [this_sym9858].concat(args9859.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9868 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9869 = this;
  if(cljs.core._lookup.call(null, this__9869.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9870 = this;
  return cljs.core.count.call(null, this__9870.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9871 = this;
  this__9871.transient_map = cljs.core.dissoc_BANG_.call(null, this__9871.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9872 = this;
  this__9872.transient_map = cljs.core.assoc_BANG_.call(null, this__9872.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9873 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9873.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9877 = this;
  var h__2247__auto____9878 = this__9877.__hash;
  if(!(h__2247__auto____9878 == null)) {
    return h__2247__auto____9878
  }else {
    var h__2247__auto____9879 = cljs.core.hash_iset.call(null, coll);
    this__9877.__hash = h__2247__auto____9879;
    return h__2247__auto____9879
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9880 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9881 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9881.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9907 = null;
  var G__9907__2 = function(this_sym9882, k) {
    var this__9884 = this;
    var this_sym9882__9885 = this;
    var coll__9886 = this_sym9882__9885;
    return coll__9886.cljs$core$ILookup$_lookup$arity$2(coll__9886, k)
  };
  var G__9907__3 = function(this_sym9883, k, not_found) {
    var this__9884 = this;
    var this_sym9883__9887 = this;
    var coll__9888 = this_sym9883__9887;
    return coll__9888.cljs$core$ILookup$_lookup$arity$3(coll__9888, k, not_found)
  };
  G__9907 = function(this_sym9883, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9907__2.call(this, this_sym9883, k);
      case 3:
        return G__9907__3.call(this, this_sym9883, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9907
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9875, args9876) {
  var this__9889 = this;
  return this_sym9875.call.apply(this_sym9875, [this_sym9875].concat(args9876.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9890 = this;
  return new cljs.core.PersistentTreeSet(this__9890.meta, cljs.core.assoc.call(null, this__9890.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9891 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9891.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9892 = this;
  var this__9893 = this;
  return cljs.core.pr_str.call(null, this__9893)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9894 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9894.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9895 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9895.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9896 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9897 = this;
  return cljs.core._comparator.call(null, this__9897.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9898 = this;
  return cljs.core.keys.call(null, this__9898.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9899 = this;
  return new cljs.core.PersistentTreeSet(this__9899.meta, cljs.core.dissoc.call(null, this__9899.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9900 = this;
  return cljs.core.count.call(null, this__9900.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9901 = this;
  var and__3822__auto____9902 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9902) {
    var and__3822__auto____9903 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9903) {
      return cljs.core.every_QMARK_.call(null, function(p1__9857_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9857_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9903
    }
  }else {
    return and__3822__auto____9902
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9904 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9904.tree_map, this__9904.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9905 = this;
  return this__9905.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9906 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9906.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9912__delegate = function(keys) {
      var in__9910 = cljs.core.seq.call(null, keys);
      var out__9911 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9910)) {
          var G__9913 = cljs.core.next.call(null, in__9910);
          var G__9914 = cljs.core.conj_BANG_.call(null, out__9911, cljs.core.first.call(null, in__9910));
          in__9910 = G__9913;
          out__9911 = G__9914;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9911)
        }
        break
      }
    };
    var G__9912 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9912__delegate.call(this, keys)
    };
    G__9912.cljs$lang$maxFixedArity = 0;
    G__9912.cljs$lang$applyTo = function(arglist__9915) {
      var keys = cljs.core.seq(arglist__9915);
      return G__9912__delegate(keys)
    };
    G__9912.cljs$lang$arity$variadic = G__9912__delegate;
    return G__9912
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__9916) {
    var keys = cljs.core.seq(arglist__9916);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__9918) {
    var comparator = cljs.core.first(arglist__9918);
    var keys = cljs.core.rest(arglist__9918);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9924 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____9925 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____9925)) {
        var e__9926 = temp__3971__auto____9925;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9926))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9924, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9917_SHARP_) {
      var temp__3971__auto____9927 = cljs.core.find.call(null, smap, p1__9917_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9927)) {
        var e__9928 = temp__3971__auto____9927;
        return cljs.core.second.call(null, e__9928)
      }else {
        return p1__9917_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9958 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9951, seen) {
        while(true) {
          var vec__9952__9953 = p__9951;
          var f__9954 = cljs.core.nth.call(null, vec__9952__9953, 0, null);
          var xs__9955 = vec__9952__9953;
          var temp__3974__auto____9956 = cljs.core.seq.call(null, xs__9955);
          if(temp__3974__auto____9956) {
            var s__9957 = temp__3974__auto____9956;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9954)) {
              var G__9959 = cljs.core.rest.call(null, s__9957);
              var G__9960 = seen;
              p__9951 = G__9959;
              seen = G__9960;
              continue
            }else {
              return cljs.core.cons.call(null, f__9954, step.call(null, cljs.core.rest.call(null, s__9957), cljs.core.conj.call(null, seen, f__9954)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9958.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9963 = cljs.core.PersistentVector.EMPTY;
  var s__9964 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9964)) {
      var G__9965 = cljs.core.conj.call(null, ret__9963, cljs.core.first.call(null, s__9964));
      var G__9966 = cljs.core.next.call(null, s__9964);
      ret__9963 = G__9965;
      s__9964 = G__9966;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9963)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9969 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____9969) {
        return or__3824__auto____9969
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9970 = x.lastIndexOf("/");
      if(i__9970 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9970 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____9973 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____9973) {
      return or__3824__auto____9973
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9974 = x.lastIndexOf("/");
    if(i__9974 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9974)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9981 = cljs.core.ObjMap.EMPTY;
  var ks__9982 = cljs.core.seq.call(null, keys);
  var vs__9983 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____9984 = ks__9982;
      if(and__3822__auto____9984) {
        return vs__9983
      }else {
        return and__3822__auto____9984
      }
    }()) {
      var G__9985 = cljs.core.assoc.call(null, map__9981, cljs.core.first.call(null, ks__9982), cljs.core.first.call(null, vs__9983));
      var G__9986 = cljs.core.next.call(null, ks__9982);
      var G__9987 = cljs.core.next.call(null, vs__9983);
      map__9981 = G__9985;
      ks__9982 = G__9986;
      vs__9983 = G__9987;
      continue
    }else {
      return map__9981
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__9990__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9975_SHARP_, p2__9976_SHARP_) {
        return max_key.call(null, k, p1__9975_SHARP_, p2__9976_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9990 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9990__delegate.call(this, k, x, y, more)
    };
    G__9990.cljs$lang$maxFixedArity = 3;
    G__9990.cljs$lang$applyTo = function(arglist__9991) {
      var k = cljs.core.first(arglist__9991);
      var x = cljs.core.first(cljs.core.next(arglist__9991));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9991)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9991)));
      return G__9990__delegate(k, x, y, more)
    };
    G__9990.cljs$lang$arity$variadic = G__9990__delegate;
    return G__9990
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__9992__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9988_SHARP_, p2__9989_SHARP_) {
        return min_key.call(null, k, p1__9988_SHARP_, p2__9989_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9992 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9992__delegate.call(this, k, x, y, more)
    };
    G__9992.cljs$lang$maxFixedArity = 3;
    G__9992.cljs$lang$applyTo = function(arglist__9993) {
      var k = cljs.core.first(arglist__9993);
      var x = cljs.core.first(cljs.core.next(arglist__9993));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9993)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9993)));
      return G__9992__delegate(k, x, y, more)
    };
    G__9992.cljs$lang$arity$variadic = G__9992__delegate;
    return G__9992
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9996 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9996) {
        var s__9997 = temp__3974__auto____9996;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9997), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9997)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____10000 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10000) {
      var s__10001 = temp__3974__auto____10000;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__10001)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__10001), take_while.call(null, pred, cljs.core.rest.call(null, s__10001)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__10003 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__10003.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__10015 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____10016 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____10016)) {
        var vec__10017__10018 = temp__3974__auto____10016;
        var e__10019 = cljs.core.nth.call(null, vec__10017__10018, 0, null);
        var s__10020 = vec__10017__10018;
        if(cljs.core.truth_(include__10015.call(null, e__10019))) {
          return s__10020
        }else {
          return cljs.core.next.call(null, s__10020)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__10015, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____10021 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____10021)) {
      var vec__10022__10023 = temp__3974__auto____10021;
      var e__10024 = cljs.core.nth.call(null, vec__10022__10023, 0, null);
      var s__10025 = vec__10022__10023;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__10024)) ? s__10025 : cljs.core.next.call(null, s__10025))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__10037 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____10038 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____10038)) {
        var vec__10039__10040 = temp__3974__auto____10038;
        var e__10041 = cljs.core.nth.call(null, vec__10039__10040, 0, null);
        var s__10042 = vec__10039__10040;
        if(cljs.core.truth_(include__10037.call(null, e__10041))) {
          return s__10042
        }else {
          return cljs.core.next.call(null, s__10042)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__10037, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____10043 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____10043)) {
      var vec__10044__10045 = temp__3974__auto____10043;
      var e__10046 = cljs.core.nth.call(null, vec__10044__10045, 0, null);
      var s__10047 = vec__10044__10045;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__10046)) ? s__10047 : cljs.core.next.call(null, s__10047))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__10048 = this;
  var h__2247__auto____10049 = this__10048.__hash;
  if(!(h__2247__auto____10049 == null)) {
    return h__2247__auto____10049
  }else {
    var h__2247__auto____10050 = cljs.core.hash_coll.call(null, rng);
    this__10048.__hash = h__2247__auto____10050;
    return h__2247__auto____10050
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__10051 = this;
  if(this__10051.step > 0) {
    if(this__10051.start + this__10051.step < this__10051.end) {
      return new cljs.core.Range(this__10051.meta, this__10051.start + this__10051.step, this__10051.end, this__10051.step, null)
    }else {
      return null
    }
  }else {
    if(this__10051.start + this__10051.step > this__10051.end) {
      return new cljs.core.Range(this__10051.meta, this__10051.start + this__10051.step, this__10051.end, this__10051.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__10052 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__10053 = this;
  var this__10054 = this;
  return cljs.core.pr_str.call(null, this__10054)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__10055 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__10056 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__10057 = this;
  if(this__10057.step > 0) {
    if(this__10057.start < this__10057.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__10057.start > this__10057.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__10058 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__10058.end - this__10058.start) / this__10058.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__10059 = this;
  return this__10059.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__10060 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__10060.meta, this__10060.start + this__10060.step, this__10060.end, this__10060.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__10061 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__10062 = this;
  return new cljs.core.Range(meta, this__10062.start, this__10062.end, this__10062.step, this__10062.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__10063 = this;
  return this__10063.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__10064 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__10064.start + n * this__10064.step
  }else {
    if(function() {
      var and__3822__auto____10065 = this__10064.start > this__10064.end;
      if(and__3822__auto____10065) {
        return this__10064.step === 0
      }else {
        return and__3822__auto____10065
      }
    }()) {
      return this__10064.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__10066 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__10066.start + n * this__10066.step
  }else {
    if(function() {
      var and__3822__auto____10067 = this__10066.start > this__10066.end;
      if(and__3822__auto____10067) {
        return this__10066.step === 0
      }else {
        return and__3822__auto____10067
      }
    }()) {
      return this__10066.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__10068 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10068.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____10071 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10071) {
      var s__10072 = temp__3974__auto____10071;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__10072), take_nth.call(null, n, cljs.core.drop.call(null, n, s__10072)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____10079 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____10079) {
      var s__10080 = temp__3974__auto____10079;
      var fst__10081 = cljs.core.first.call(null, s__10080);
      var fv__10082 = f.call(null, fst__10081);
      var run__10083 = cljs.core.cons.call(null, fst__10081, cljs.core.take_while.call(null, function(p1__10073_SHARP_) {
        return cljs.core._EQ_.call(null, fv__10082, f.call(null, p1__10073_SHARP_))
      }, cljs.core.next.call(null, s__10080)));
      return cljs.core.cons.call(null, run__10083, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__10083), s__10080))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____10098 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____10098) {
        var s__10099 = temp__3971__auto____10098;
        return reductions.call(null, f, cljs.core.first.call(null, s__10099), cljs.core.rest.call(null, s__10099))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____10100 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10100) {
        var s__10101 = temp__3974__auto____10100;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__10101)), cljs.core.rest.call(null, s__10101))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__10104 = null;
      var G__10104__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__10104__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__10104__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__10104__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__10104__4 = function() {
        var G__10105__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__10105 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10105__delegate.call(this, x, y, z, args)
        };
        G__10105.cljs$lang$maxFixedArity = 3;
        G__10105.cljs$lang$applyTo = function(arglist__10106) {
          var x = cljs.core.first(arglist__10106);
          var y = cljs.core.first(cljs.core.next(arglist__10106));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10106)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10106)));
          return G__10105__delegate(x, y, z, args)
        };
        G__10105.cljs$lang$arity$variadic = G__10105__delegate;
        return G__10105
      }();
      G__10104 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10104__0.call(this);
          case 1:
            return G__10104__1.call(this, x);
          case 2:
            return G__10104__2.call(this, x, y);
          case 3:
            return G__10104__3.call(this, x, y, z);
          default:
            return G__10104__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10104.cljs$lang$maxFixedArity = 3;
      G__10104.cljs$lang$applyTo = G__10104__4.cljs$lang$applyTo;
      return G__10104
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__10107 = null;
      var G__10107__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__10107__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__10107__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__10107__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__10107__4 = function() {
        var G__10108__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__10108 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10108__delegate.call(this, x, y, z, args)
        };
        G__10108.cljs$lang$maxFixedArity = 3;
        G__10108.cljs$lang$applyTo = function(arglist__10109) {
          var x = cljs.core.first(arglist__10109);
          var y = cljs.core.first(cljs.core.next(arglist__10109));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10109)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10109)));
          return G__10108__delegate(x, y, z, args)
        };
        G__10108.cljs$lang$arity$variadic = G__10108__delegate;
        return G__10108
      }();
      G__10107 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10107__0.call(this);
          case 1:
            return G__10107__1.call(this, x);
          case 2:
            return G__10107__2.call(this, x, y);
          case 3:
            return G__10107__3.call(this, x, y, z);
          default:
            return G__10107__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10107.cljs$lang$maxFixedArity = 3;
      G__10107.cljs$lang$applyTo = G__10107__4.cljs$lang$applyTo;
      return G__10107
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__10110 = null;
      var G__10110__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__10110__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__10110__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__10110__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__10110__4 = function() {
        var G__10111__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__10111 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10111__delegate.call(this, x, y, z, args)
        };
        G__10111.cljs$lang$maxFixedArity = 3;
        G__10111.cljs$lang$applyTo = function(arglist__10112) {
          var x = cljs.core.first(arglist__10112);
          var y = cljs.core.first(cljs.core.next(arglist__10112));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10112)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10112)));
          return G__10111__delegate(x, y, z, args)
        };
        G__10111.cljs$lang$arity$variadic = G__10111__delegate;
        return G__10111
      }();
      G__10110 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10110__0.call(this);
          case 1:
            return G__10110__1.call(this, x);
          case 2:
            return G__10110__2.call(this, x, y);
          case 3:
            return G__10110__3.call(this, x, y, z);
          default:
            return G__10110__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10110.cljs$lang$maxFixedArity = 3;
      G__10110.cljs$lang$applyTo = G__10110__4.cljs$lang$applyTo;
      return G__10110
    }()
  };
  var juxt__4 = function() {
    var G__10113__delegate = function(f, g, h, fs) {
      var fs__10103 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__10114 = null;
        var G__10114__0 = function() {
          return cljs.core.reduce.call(null, function(p1__10084_SHARP_, p2__10085_SHARP_) {
            return cljs.core.conj.call(null, p1__10084_SHARP_, p2__10085_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__10103)
        };
        var G__10114__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__10086_SHARP_, p2__10087_SHARP_) {
            return cljs.core.conj.call(null, p1__10086_SHARP_, p2__10087_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__10103)
        };
        var G__10114__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__10088_SHARP_, p2__10089_SHARP_) {
            return cljs.core.conj.call(null, p1__10088_SHARP_, p2__10089_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__10103)
        };
        var G__10114__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__10090_SHARP_, p2__10091_SHARP_) {
            return cljs.core.conj.call(null, p1__10090_SHARP_, p2__10091_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__10103)
        };
        var G__10114__4 = function() {
          var G__10115__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__10092_SHARP_, p2__10093_SHARP_) {
              return cljs.core.conj.call(null, p1__10092_SHARP_, cljs.core.apply.call(null, p2__10093_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__10103)
          };
          var G__10115 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__10115__delegate.call(this, x, y, z, args)
          };
          G__10115.cljs$lang$maxFixedArity = 3;
          G__10115.cljs$lang$applyTo = function(arglist__10116) {
            var x = cljs.core.first(arglist__10116);
            var y = cljs.core.first(cljs.core.next(arglist__10116));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10116)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10116)));
            return G__10115__delegate(x, y, z, args)
          };
          G__10115.cljs$lang$arity$variadic = G__10115__delegate;
          return G__10115
        }();
        G__10114 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__10114__0.call(this);
            case 1:
              return G__10114__1.call(this, x);
            case 2:
              return G__10114__2.call(this, x, y);
            case 3:
              return G__10114__3.call(this, x, y, z);
            default:
              return G__10114__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__10114.cljs$lang$maxFixedArity = 3;
        G__10114.cljs$lang$applyTo = G__10114__4.cljs$lang$applyTo;
        return G__10114
      }()
    };
    var G__10113 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10113__delegate.call(this, f, g, h, fs)
    };
    G__10113.cljs$lang$maxFixedArity = 3;
    G__10113.cljs$lang$applyTo = function(arglist__10117) {
      var f = cljs.core.first(arglist__10117);
      var g = cljs.core.first(cljs.core.next(arglist__10117));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10117)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10117)));
      return G__10113__delegate(f, g, h, fs)
    };
    G__10113.cljs$lang$arity$variadic = G__10113__delegate;
    return G__10113
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__10120 = cljs.core.next.call(null, coll);
        coll = G__10120;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____10119 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____10119) {
          return n > 0
        }else {
          return and__3822__auto____10119
        }
      }())) {
        var G__10121 = n - 1;
        var G__10122 = cljs.core.next.call(null, coll);
        n = G__10121;
        coll = G__10122;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__10124 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__10124), s)) {
    if(cljs.core.count.call(null, matches__10124) === 1) {
      return cljs.core.first.call(null, matches__10124)
    }else {
      return cljs.core.vec.call(null, matches__10124)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__10126 = re.exec(s);
  if(matches__10126 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__10126) === 1) {
      return cljs.core.first.call(null, matches__10126)
    }else {
      return cljs.core.vec.call(null, matches__10126)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__10131 = cljs.core.re_find.call(null, re, s);
  var match_idx__10132 = s.search(re);
  var match_str__10133 = cljs.core.coll_QMARK_.call(null, match_data__10131) ? cljs.core.first.call(null, match_data__10131) : match_data__10131;
  var post_match__10134 = cljs.core.subs.call(null, s, match_idx__10132 + cljs.core.count.call(null, match_str__10133));
  if(cljs.core.truth_(match_data__10131)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__10131, re_seq.call(null, re, post_match__10134))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__10141__10142 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___10143 = cljs.core.nth.call(null, vec__10141__10142, 0, null);
  var flags__10144 = cljs.core.nth.call(null, vec__10141__10142, 1, null);
  var pattern__10145 = cljs.core.nth.call(null, vec__10141__10142, 2, null);
  return new RegExp(pattern__10145, flags__10144)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__10135_SHARP_) {
    return print_one.call(null, p1__10135_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____10155 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____10155)) {
            var and__3822__auto____10159 = function() {
              var G__10156__10157 = obj;
              if(G__10156__10157) {
                if(function() {
                  var or__3824__auto____10158 = G__10156__10157.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____10158) {
                    return or__3824__auto____10158
                  }else {
                    return G__10156__10157.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__10156__10157.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10156__10157)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10156__10157)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____10159)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____10159
            }
          }else {
            return and__3822__auto____10155
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____10160 = !(obj == null);
          if(and__3822__auto____10160) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____10160
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__10161__10162 = obj;
          if(G__10161__10162) {
            if(function() {
              var or__3824__auto____10163 = G__10161__10162.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____10163) {
                return or__3824__auto____10163
              }else {
                return G__10161__10162.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__10161__10162.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10161__10162)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10161__10162)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__10183 = new goog.string.StringBuffer;
  var G__10184__10185 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10184__10185) {
    var string__10186 = cljs.core.first.call(null, G__10184__10185);
    var G__10184__10187 = G__10184__10185;
    while(true) {
      sb__10183.append(string__10186);
      var temp__3974__auto____10188 = cljs.core.next.call(null, G__10184__10187);
      if(temp__3974__auto____10188) {
        var G__10184__10189 = temp__3974__auto____10188;
        var G__10202 = cljs.core.first.call(null, G__10184__10189);
        var G__10203 = G__10184__10189;
        string__10186 = G__10202;
        G__10184__10187 = G__10203;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10190__10191 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10190__10191) {
    var obj__10192 = cljs.core.first.call(null, G__10190__10191);
    var G__10190__10193 = G__10190__10191;
    while(true) {
      sb__10183.append(" ");
      var G__10194__10195 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10192, opts));
      if(G__10194__10195) {
        var string__10196 = cljs.core.first.call(null, G__10194__10195);
        var G__10194__10197 = G__10194__10195;
        while(true) {
          sb__10183.append(string__10196);
          var temp__3974__auto____10198 = cljs.core.next.call(null, G__10194__10197);
          if(temp__3974__auto____10198) {
            var G__10194__10199 = temp__3974__auto____10198;
            var G__10204 = cljs.core.first.call(null, G__10194__10199);
            var G__10205 = G__10194__10199;
            string__10196 = G__10204;
            G__10194__10197 = G__10205;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10200 = cljs.core.next.call(null, G__10190__10193);
      if(temp__3974__auto____10200) {
        var G__10190__10201 = temp__3974__auto____10200;
        var G__10206 = cljs.core.first.call(null, G__10190__10201);
        var G__10207 = G__10190__10201;
        obj__10192 = G__10206;
        G__10190__10193 = G__10207;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__10183
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__10209 = cljs.core.pr_sb.call(null, objs, opts);
  sb__10209.append("\n");
  return[cljs.core.str(sb__10209)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__10228__10229 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10228__10229) {
    var string__10230 = cljs.core.first.call(null, G__10228__10229);
    var G__10228__10231 = G__10228__10229;
    while(true) {
      cljs.core.string_print.call(null, string__10230);
      var temp__3974__auto____10232 = cljs.core.next.call(null, G__10228__10231);
      if(temp__3974__auto____10232) {
        var G__10228__10233 = temp__3974__auto____10232;
        var G__10246 = cljs.core.first.call(null, G__10228__10233);
        var G__10247 = G__10228__10233;
        string__10230 = G__10246;
        G__10228__10231 = G__10247;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10234__10235 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10234__10235) {
    var obj__10236 = cljs.core.first.call(null, G__10234__10235);
    var G__10234__10237 = G__10234__10235;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__10238__10239 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10236, opts));
      if(G__10238__10239) {
        var string__10240 = cljs.core.first.call(null, G__10238__10239);
        var G__10238__10241 = G__10238__10239;
        while(true) {
          cljs.core.string_print.call(null, string__10240);
          var temp__3974__auto____10242 = cljs.core.next.call(null, G__10238__10241);
          if(temp__3974__auto____10242) {
            var G__10238__10243 = temp__3974__auto____10242;
            var G__10248 = cljs.core.first.call(null, G__10238__10243);
            var G__10249 = G__10238__10243;
            string__10240 = G__10248;
            G__10238__10241 = G__10249;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10244 = cljs.core.next.call(null, G__10234__10237);
      if(temp__3974__auto____10244) {
        var G__10234__10245 = temp__3974__auto____10244;
        var G__10250 = cljs.core.first.call(null, G__10234__10245);
        var G__10251 = G__10234__10245;
        obj__10236 = G__10250;
        G__10234__10237 = G__10251;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__10252) {
    var objs = cljs.core.seq(arglist__10252);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__10253) {
    var objs = cljs.core.seq(arglist__10253);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__10254) {
    var objs = cljs.core.seq(arglist__10254);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__10255) {
    var objs = cljs.core.seq(arglist__10255);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__10256) {
    var objs = cljs.core.seq(arglist__10256);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__10257) {
    var objs = cljs.core.seq(arglist__10257);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__10258) {
    var objs = cljs.core.seq(arglist__10258);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__10259) {
    var objs = cljs.core.seq(arglist__10259);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__10260) {
    var fmt = cljs.core.first(arglist__10260);
    var args = cljs.core.rest(arglist__10260);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10261 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10261, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10262 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10262, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10263 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10263, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____10264 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____10264)) {
        var nspc__10265 = temp__3974__auto____10264;
        return[cljs.core.str(nspc__10265), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____10266 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____10266)) {
          var nspc__10267 = temp__3974__auto____10266;
          return[cljs.core.str(nspc__10267), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10268 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10268, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__10270 = function(n, len) {
    var ns__10269 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__10269) < len) {
        var G__10272 = [cljs.core.str("0"), cljs.core.str(ns__10269)].join("");
        ns__10269 = G__10272;
        continue
      }else {
        return ns__10269
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__10270.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__10270.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__10270.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10270.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10270.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__10270.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10271 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10271, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10273 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__10274 = this;
  var G__10275__10276 = cljs.core.seq.call(null, this__10274.watches);
  if(G__10275__10276) {
    var G__10278__10280 = cljs.core.first.call(null, G__10275__10276);
    var vec__10279__10281 = G__10278__10280;
    var key__10282 = cljs.core.nth.call(null, vec__10279__10281, 0, null);
    var f__10283 = cljs.core.nth.call(null, vec__10279__10281, 1, null);
    var G__10275__10284 = G__10275__10276;
    var G__10278__10285 = G__10278__10280;
    var G__10275__10286 = G__10275__10284;
    while(true) {
      var vec__10287__10288 = G__10278__10285;
      var key__10289 = cljs.core.nth.call(null, vec__10287__10288, 0, null);
      var f__10290 = cljs.core.nth.call(null, vec__10287__10288, 1, null);
      var G__10275__10291 = G__10275__10286;
      f__10290.call(null, key__10289, this$, oldval, newval);
      var temp__3974__auto____10292 = cljs.core.next.call(null, G__10275__10291);
      if(temp__3974__auto____10292) {
        var G__10275__10293 = temp__3974__auto____10292;
        var G__10300 = cljs.core.first.call(null, G__10275__10293);
        var G__10301 = G__10275__10293;
        G__10278__10285 = G__10300;
        G__10275__10286 = G__10301;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__10294 = this;
  return this$.watches = cljs.core.assoc.call(null, this__10294.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__10295 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__10295.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__10296 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__10296.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__10297 = this;
  return this__10297.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10298 = this;
  return this__10298.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__10299 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__10313__delegate = function(x, p__10302) {
      var map__10308__10309 = p__10302;
      var map__10308__10310 = cljs.core.seq_QMARK_.call(null, map__10308__10309) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10308__10309) : map__10308__10309;
      var validator__10311 = cljs.core._lookup.call(null, map__10308__10310, "\ufdd0'validator", null);
      var meta__10312 = cljs.core._lookup.call(null, map__10308__10310, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__10312, validator__10311, null)
    };
    var G__10313 = function(x, var_args) {
      var p__10302 = null;
      if(goog.isDef(var_args)) {
        p__10302 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10313__delegate.call(this, x, p__10302)
    };
    G__10313.cljs$lang$maxFixedArity = 1;
    G__10313.cljs$lang$applyTo = function(arglist__10314) {
      var x = cljs.core.first(arglist__10314);
      var p__10302 = cljs.core.rest(arglist__10314);
      return G__10313__delegate(x, p__10302)
    };
    G__10313.cljs$lang$arity$variadic = G__10313__delegate;
    return G__10313
  }();
  atom = function(x, var_args) {
    var p__10302 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____10318 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____10318)) {
    var validate__10319 = temp__3974__auto____10318;
    if(cljs.core.truth_(validate__10319.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__10320 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__10320, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__10321__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__10321 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__10321__delegate.call(this, a, f, x, y, z, more)
    };
    G__10321.cljs$lang$maxFixedArity = 5;
    G__10321.cljs$lang$applyTo = function(arglist__10322) {
      var a = cljs.core.first(arglist__10322);
      var f = cljs.core.first(cljs.core.next(arglist__10322));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10322)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10322))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10322)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10322)))));
      return G__10321__delegate(a, f, x, y, z, more)
    };
    G__10321.cljs$lang$arity$variadic = G__10321__delegate;
    return G__10321
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__10323) {
    var iref = cljs.core.first(arglist__10323);
    var f = cljs.core.first(cljs.core.next(arglist__10323));
    var args = cljs.core.rest(cljs.core.next(arglist__10323));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__10324 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__10324.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10325 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__10325.state, function(p__10326) {
    var map__10327__10328 = p__10326;
    var map__10327__10329 = cljs.core.seq_QMARK_.call(null, map__10327__10328) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10327__10328) : map__10327__10328;
    var curr_state__10330 = map__10327__10329;
    var done__10331 = cljs.core._lookup.call(null, map__10327__10329, "\ufdd0'done", null);
    if(cljs.core.truth_(done__10331)) {
      return curr_state__10330
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__10325.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__10352__10353 = options;
    var map__10352__10354 = cljs.core.seq_QMARK_.call(null, map__10352__10353) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10352__10353) : map__10352__10353;
    var keywordize_keys__10355 = cljs.core._lookup.call(null, map__10352__10354, "\ufdd0'keywordize-keys", null);
    var keyfn__10356 = cljs.core.truth_(keywordize_keys__10355) ? cljs.core.keyword : cljs.core.str;
    var f__10371 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2517__auto____10370 = function iter__10364(s__10365) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__10365__10368 = s__10365;
                    while(true) {
                      if(cljs.core.seq.call(null, s__10365__10368)) {
                        var k__10369 = cljs.core.first.call(null, s__10365__10368);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__10356.call(null, k__10369), thisfn.call(null, x[k__10369])], true), iter__10364.call(null, cljs.core.rest.call(null, s__10365__10368)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2517__auto____10370.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__10371.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__10372) {
    var x = cljs.core.first(arglist__10372);
    var options = cljs.core.rest(arglist__10372);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__10377 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__10381__delegate = function(args) {
      var temp__3971__auto____10378 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__10377), args, null);
      if(cljs.core.truth_(temp__3971__auto____10378)) {
        var v__10379 = temp__3971__auto____10378;
        return v__10379
      }else {
        var ret__10380 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__10377, cljs.core.assoc, args, ret__10380);
        return ret__10380
      }
    };
    var G__10381 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10381__delegate.call(this, args)
    };
    G__10381.cljs$lang$maxFixedArity = 0;
    G__10381.cljs$lang$applyTo = function(arglist__10382) {
      var args = cljs.core.seq(arglist__10382);
      return G__10381__delegate(args)
    };
    G__10381.cljs$lang$arity$variadic = G__10381__delegate;
    return G__10381
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__10384 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__10384)) {
        var G__10385 = ret__10384;
        f = G__10385;
        continue
      }else {
        return ret__10384
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__10386__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__10386 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10386__delegate.call(this, f, args)
    };
    G__10386.cljs$lang$maxFixedArity = 1;
    G__10386.cljs$lang$applyTo = function(arglist__10387) {
      var f = cljs.core.first(arglist__10387);
      var args = cljs.core.rest(arglist__10387);
      return G__10386__delegate(f, args)
    };
    G__10386.cljs$lang$arity$variadic = G__10386__delegate;
    return G__10386
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__10389 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__10389, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__10389, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____10398 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____10398) {
      return or__3824__auto____10398
    }else {
      var or__3824__auto____10399 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____10399) {
        return or__3824__auto____10399
      }else {
        var and__3822__auto____10400 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____10400) {
          var and__3822__auto____10401 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____10401) {
            var and__3822__auto____10402 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____10402) {
              var ret__10403 = true;
              var i__10404 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____10405 = cljs.core.not.call(null, ret__10403);
                  if(or__3824__auto____10405) {
                    return or__3824__auto____10405
                  }else {
                    return i__10404 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__10403
                }else {
                  var G__10406 = isa_QMARK_.call(null, h, child.call(null, i__10404), parent.call(null, i__10404));
                  var G__10407 = i__10404 + 1;
                  ret__10403 = G__10406;
                  i__10404 = G__10407;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____10402
            }
          }else {
            return and__3822__auto____10401
          }
        }else {
          return and__3822__auto____10400
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__10416 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__10417 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__10418 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__10419 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____10420 = cljs.core.contains_QMARK_.call(null, tp__10416.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__10418.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__10418.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__10416, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__10419.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__10417, parent, ta__10418), "\ufdd0'descendants":tf__10419.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__10418, tag, td__10417)})
    }();
    if(cljs.core.truth_(or__3824__auto____10420)) {
      return or__3824__auto____10420
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__10425 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__10426 = cljs.core.truth_(parentMap__10425.call(null, tag)) ? cljs.core.disj.call(null, parentMap__10425.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__10427 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__10426)) ? cljs.core.assoc.call(null, parentMap__10425, tag, childsParents__10426) : cljs.core.dissoc.call(null, parentMap__10425, tag);
    var deriv_seq__10428 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__10408_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__10408_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__10408_SHARP_), cljs.core.second.call(null, p1__10408_SHARP_)))
    }, cljs.core.seq.call(null, newParents__10427)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__10425.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__10409_SHARP_, p2__10410_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__10409_SHARP_, p2__10410_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__10428))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__10436 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____10438 = cljs.core.truth_(function() {
    var and__3822__auto____10437 = xprefs__10436;
    if(cljs.core.truth_(and__3822__auto____10437)) {
      return xprefs__10436.call(null, y)
    }else {
      return and__3822__auto____10437
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____10438)) {
    return or__3824__auto____10438
  }else {
    var or__3824__auto____10440 = function() {
      var ps__10439 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__10439) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__10439), prefer_table))) {
          }else {
          }
          var G__10443 = cljs.core.rest.call(null, ps__10439);
          ps__10439 = G__10443;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____10440)) {
      return or__3824__auto____10440
    }else {
      var or__3824__auto____10442 = function() {
        var ps__10441 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__10441) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__10441), y, prefer_table))) {
            }else {
            }
            var G__10444 = cljs.core.rest.call(null, ps__10441);
            ps__10441 = G__10444;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____10442)) {
        return or__3824__auto____10442
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____10446 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____10446)) {
    return or__3824__auto____10446
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__10464 = cljs.core.reduce.call(null, function(be, p__10456) {
    var vec__10457__10458 = p__10456;
    var k__10459 = cljs.core.nth.call(null, vec__10457__10458, 0, null);
    var ___10460 = cljs.core.nth.call(null, vec__10457__10458, 1, null);
    var e__10461 = vec__10457__10458;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__10459)) {
      var be2__10463 = cljs.core.truth_(function() {
        var or__3824__auto____10462 = be == null;
        if(or__3824__auto____10462) {
          return or__3824__auto____10462
        }else {
          return cljs.core.dominates.call(null, k__10459, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__10461 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__10463), k__10459, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__10459), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__10463)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__10463
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__10464)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__10464));
      return cljs.core.second.call(null, best_entry__10464)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____10469 = mf;
    if(and__3822__auto____10469) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____10469
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2418__auto____10470 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10471 = cljs.core._reset[goog.typeOf(x__2418__auto____10470)];
      if(or__3824__auto____10471) {
        return or__3824__auto____10471
      }else {
        var or__3824__auto____10472 = cljs.core._reset["_"];
        if(or__3824__auto____10472) {
          return or__3824__auto____10472
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____10477 = mf;
    if(and__3822__auto____10477) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____10477
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2418__auto____10478 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10479 = cljs.core._add_method[goog.typeOf(x__2418__auto____10478)];
      if(or__3824__auto____10479) {
        return or__3824__auto____10479
      }else {
        var or__3824__auto____10480 = cljs.core._add_method["_"];
        if(or__3824__auto____10480) {
          return or__3824__auto____10480
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10485 = mf;
    if(and__3822__auto____10485) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____10485
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2418__auto____10486 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10487 = cljs.core._remove_method[goog.typeOf(x__2418__auto____10486)];
      if(or__3824__auto____10487) {
        return or__3824__auto____10487
      }else {
        var or__3824__auto____10488 = cljs.core._remove_method["_"];
        if(or__3824__auto____10488) {
          return or__3824__auto____10488
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10493 = mf;
    if(and__3822__auto____10493) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10493
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2418__auto____10494 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10495 = cljs.core._prefer_method[goog.typeOf(x__2418__auto____10494)];
      if(or__3824__auto____10495) {
        return or__3824__auto____10495
      }else {
        var or__3824__auto____10496 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10496) {
          return or__3824__auto____10496
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10501 = mf;
    if(and__3822__auto____10501) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10501
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2418__auto____10502 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10503 = cljs.core._get_method[goog.typeOf(x__2418__auto____10502)];
      if(or__3824__auto____10503) {
        return or__3824__auto____10503
      }else {
        var or__3824__auto____10504 = cljs.core._get_method["_"];
        if(or__3824__auto____10504) {
          return or__3824__auto____10504
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10509 = mf;
    if(and__3822__auto____10509) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10509
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2418__auto____10510 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10511 = cljs.core._methods[goog.typeOf(x__2418__auto____10510)];
      if(or__3824__auto____10511) {
        return or__3824__auto____10511
      }else {
        var or__3824__auto____10512 = cljs.core._methods["_"];
        if(or__3824__auto____10512) {
          return or__3824__auto____10512
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10517 = mf;
    if(and__3822__auto____10517) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10517
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2418__auto____10518 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10519 = cljs.core._prefers[goog.typeOf(x__2418__auto____10518)];
      if(or__3824__auto____10519) {
        return or__3824__auto____10519
      }else {
        var or__3824__auto____10520 = cljs.core._prefers["_"];
        if(or__3824__auto____10520) {
          return or__3824__auto____10520
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10525 = mf;
    if(and__3822__auto____10525) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10525
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2418__auto____10526 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10527 = cljs.core._dispatch[goog.typeOf(x__2418__auto____10526)];
      if(or__3824__auto____10527) {
        return or__3824__auto____10527
      }else {
        var or__3824__auto____10528 = cljs.core._dispatch["_"];
        if(or__3824__auto____10528) {
          return or__3824__auto____10528
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10531 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10532 = cljs.core._get_method.call(null, mf, dispatch_val__10531);
  if(cljs.core.truth_(target_fn__10532)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10531)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10532, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10533 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10534 = this;
  cljs.core.swap_BANG_.call(null, this__10534.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10534.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10534.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10534.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10535 = this;
  cljs.core.swap_BANG_.call(null, this__10535.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10535.method_cache, this__10535.method_table, this__10535.cached_hierarchy, this__10535.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10536 = this;
  cljs.core.swap_BANG_.call(null, this__10536.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10536.method_cache, this__10536.method_table, this__10536.cached_hierarchy, this__10536.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10537 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10537.cached_hierarchy), cljs.core.deref.call(null, this__10537.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10537.method_cache, this__10537.method_table, this__10537.cached_hierarchy, this__10537.hierarchy)
  }
  var temp__3971__auto____10538 = cljs.core.deref.call(null, this__10537.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10538)) {
    var target_fn__10539 = temp__3971__auto____10538;
    return target_fn__10539
  }else {
    var temp__3971__auto____10540 = cljs.core.find_and_cache_best_method.call(null, this__10537.name, dispatch_val, this__10537.hierarchy, this__10537.method_table, this__10537.prefer_table, this__10537.method_cache, this__10537.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10540)) {
      var target_fn__10541 = temp__3971__auto____10540;
      return target_fn__10541
    }else {
      return cljs.core.deref.call(null, this__10537.method_table).call(null, this__10537.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10542 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10542.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10542.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10542.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10542.method_cache, this__10542.method_table, this__10542.cached_hierarchy, this__10542.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10543 = this;
  return cljs.core.deref.call(null, this__10543.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10544 = this;
  return cljs.core.deref.call(null, this__10544.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10545 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10545.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10547__delegate = function(_, args) {
    var self__10546 = this;
    return cljs.core._dispatch.call(null, self__10546, args)
  };
  var G__10547 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10547__delegate.call(this, _, args)
  };
  G__10547.cljs$lang$maxFixedArity = 1;
  G__10547.cljs$lang$applyTo = function(arglist__10548) {
    var _ = cljs.core.first(arglist__10548);
    var args = cljs.core.rest(arglist__10548);
    return G__10547__delegate(_, args)
  };
  G__10547.cljs$lang$arity$variadic = G__10547__delegate;
  return G__10547
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10549 = this;
  return cljs.core._dispatch.call(null, self__10549, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10550 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10552, _) {
  var this__10551 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10551.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10553 = this;
  var and__3822__auto____10554 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10554) {
    return this__10553.uuid === other.uuid
  }else {
    return and__3822__auto____10554
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10555 = this;
  var this__10556 = this;
  return cljs.core.pr_str.call(null, this__10556)
};
cljs.core.UUID;
goog.provide("aima_clojure.game");
goog.require("cljs.core");
aima_clojure.game.Game = {};
aima_clojure.game.moves = function moves(game, state) {
  if(function() {
    var and__3822__auto____10561 = game;
    if(and__3822__auto____10561) {
      return game.aima_clojure$game$Game$moves$arity$2
    }else {
      return and__3822__auto____10561
    }
  }()) {
    return game.aima_clojure$game$Game$moves$arity$2(game, state)
  }else {
    var x__2418__auto____10562 = game == null ? null : game;
    return function() {
      var or__3824__auto____10563 = aima_clojure.game.moves[goog.typeOf(x__2418__auto____10562)];
      if(or__3824__auto____10563) {
        return or__3824__auto____10563
      }else {
        var or__3824__auto____10564 = aima_clojure.game.moves["_"];
        if(or__3824__auto____10564) {
          return or__3824__auto____10564
        }else {
          throw cljs.core.missing_protocol.call(null, "Game.moves", game);
        }
      }
    }().call(null, game, state)
  }
};
aima_clojure.game.make_move = function make_move(game, state, move) {
  if(function() {
    var and__3822__auto____10569 = game;
    if(and__3822__auto____10569) {
      return game.aima_clojure$game$Game$make_move$arity$3
    }else {
      return and__3822__auto____10569
    }
  }()) {
    return game.aima_clojure$game$Game$make_move$arity$3(game, state, move)
  }else {
    var x__2418__auto____10570 = game == null ? null : game;
    return function() {
      var or__3824__auto____10571 = aima_clojure.game.make_move[goog.typeOf(x__2418__auto____10570)];
      if(or__3824__auto____10571) {
        return or__3824__auto____10571
      }else {
        var or__3824__auto____10572 = aima_clojure.game.make_move["_"];
        if(or__3824__auto____10572) {
          return or__3824__auto____10572
        }else {
          throw cljs.core.missing_protocol.call(null, "Game.make-move", game);
        }
      }
    }().call(null, game, state, move)
  }
};
aima_clojure.game.utility = function utility(game, state, player) {
  if(function() {
    var and__3822__auto____10577 = game;
    if(and__3822__auto____10577) {
      return game.aima_clojure$game$Game$utility$arity$3
    }else {
      return and__3822__auto____10577
    }
  }()) {
    return game.aima_clojure$game$Game$utility$arity$3(game, state, player)
  }else {
    var x__2418__auto____10578 = game == null ? null : game;
    return function() {
      var or__3824__auto____10579 = aima_clojure.game.utility[goog.typeOf(x__2418__auto____10578)];
      if(or__3824__auto____10579) {
        return or__3824__auto____10579
      }else {
        var or__3824__auto____10580 = aima_clojure.game.utility["_"];
        if(or__3824__auto____10580) {
          return or__3824__auto____10580
        }else {
          throw cljs.core.missing_protocol.call(null, "Game.utility", game);
        }
      }
    }().call(null, game, state, player)
  }
};
aima_clojure.game.terminal_test = function terminal_test(game, state) {
  if(function() {
    var and__3822__auto____10585 = game;
    if(and__3822__auto____10585) {
      return game.aima_clojure$game$Game$terminal_test$arity$2
    }else {
      return and__3822__auto____10585
    }
  }()) {
    return game.aima_clojure$game$Game$terminal_test$arity$2(game, state)
  }else {
    var x__2418__auto____10586 = game == null ? null : game;
    return function() {
      var or__3824__auto____10587 = aima_clojure.game.terminal_test[goog.typeOf(x__2418__auto____10586)];
      if(or__3824__auto____10587) {
        return or__3824__auto____10587
      }else {
        var or__3824__auto____10588 = aima_clojure.game.terminal_test["_"];
        if(or__3824__auto____10588) {
          return or__3824__auto____10588
        }else {
          throw cljs.core.missing_protocol.call(null, "Game.terminal-test", game);
        }
      }
    }().call(null, game, state)
  }
};
aima_clojure.game.to_move = function to_move(game, state) {
  if(function() {
    var and__3822__auto____10593 = game;
    if(and__3822__auto____10593) {
      return game.aima_clojure$game$Game$to_move$arity$2
    }else {
      return and__3822__auto____10593
    }
  }()) {
    return game.aima_clojure$game$Game$to_move$arity$2(game, state)
  }else {
    var x__2418__auto____10594 = game == null ? null : game;
    return function() {
      var or__3824__auto____10595 = aima_clojure.game.to_move[goog.typeOf(x__2418__auto____10594)];
      if(or__3824__auto____10595) {
        return or__3824__auto____10595
      }else {
        var or__3824__auto____10596 = aima_clojure.game.to_move["_"];
        if(or__3824__auto____10596) {
          return or__3824__auto____10596
        }else {
          throw cljs.core.missing_protocol.call(null, "Game.to-move", game);
        }
      }
    }().call(null, game, state)
  }
};
aima_clojure.game.display = function display(game, state) {
  if(function() {
    var and__3822__auto____10601 = game;
    if(and__3822__auto____10601) {
      return game.aima_clojure$game$Game$display$arity$2
    }else {
      return and__3822__auto____10601
    }
  }()) {
    return game.aima_clojure$game$Game$display$arity$2(game, state)
  }else {
    var x__2418__auto____10602 = game == null ? null : game;
    return function() {
      var or__3824__auto____10603 = aima_clojure.game.display[goog.typeOf(x__2418__auto____10602)];
      if(or__3824__auto____10603) {
        return or__3824__auto____10603
      }else {
        var or__3824__auto____10604 = aima_clojure.game.display["_"];
        if(or__3824__auto____10604) {
          return or__3824__auto____10604
        }else {
          throw cljs.core.missing_protocol.call(null, "Game.display", game);
        }
      }
    }().call(null, game, state)
  }
};
aima_clojure.game.initial = function initial(game) {
  if(function() {
    var and__3822__auto____10609 = game;
    if(and__3822__auto____10609) {
      return game.aima_clojure$game$Game$initial$arity$1
    }else {
      return and__3822__auto____10609
    }
  }()) {
    return game.aima_clojure$game$Game$initial$arity$1(game)
  }else {
    var x__2418__auto____10610 = game == null ? null : game;
    return function() {
      var or__3824__auto____10611 = aima_clojure.game.initial[goog.typeOf(x__2418__auto____10610)];
      if(or__3824__auto____10611) {
        return or__3824__auto____10611
      }else {
        var or__3824__auto____10612 = aima_clojure.game.initial["_"];
        if(or__3824__auto____10612) {
          return or__3824__auto____10612
        }else {
          throw cljs.core.missing_protocol.call(null, "Game.initial", game);
        }
      }
    }().call(null, game)
  }
};
aima_clojure.game.max_value = function max_value(game, state, player) {
  if(cljs.core.truth_(aima_clojure.game.terminal_test.call(null, game, state))) {
    return aima_clojure.game.utility.call(null, game, state, player)
  }else {
    return cljs.core.apply.call(null, cljs.core.max, cljs.core.map.call(null, function(p1__10613_SHARP_) {
      return aima_clojure.game.min_value.call(null, game, aima_clojure.game.make_move.call(null, game, state, p1__10613_SHARP_), player)
    }, aima_clojure.game.moves.call(null, game, state)))
  }
};
aima_clojure.game.min_value = function min_value(game, state, player) {
  if(cljs.core.truth_(aima_clojure.game.terminal_test.call(null, game, state))) {
    return aima_clojure.game.utility.call(null, game, state, player)
  }else {
    return cljs.core.apply.call(null, cljs.core.min, cljs.core.map.call(null, function(p1__10614_SHARP_) {
      return aima_clojure.game.max_value.call(null, game, aima_clojure.game.make_move.call(null, game, state, p1__10614_SHARP_), player)
    }, aima_clojure.game.moves.call(null, game, state)))
  }
};
aima_clojure.game.minimax_decision = function minimax_decision(game, state) {
  var player__10617 = aima_clojure.game.to_move.call(null, game, state);
  return cljs.core.apply.call(null, cljs.core.max_key, function(p1__10615_SHARP_) {
    return aima_clojure.game.min_value.call(null, game, aima_clojure.game.make_move.call(null, game, state, p1__10615_SHARP_), player__10617)
  }, aima_clojure.game.moves.call(null, game, state))
};
goog.provide("aima_clojure.games.tic_tac_toe");
goog.require("cljs.core");
goog.require("aima_clojure.game");
aima_clojure.games.tic_tac_toe.empty_count = function empty_count(p__6434) {
  var map__6440__6441 = p__6434;
  var map__6440__6442 = cljs.core.seq_QMARK_.call(null, map__6440__6441) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6440__6441) : map__6440__6441;
  var state__6443 = map__6440__6442;
  var board__6444 = cljs.core._lookup.call(null, map__6440__6442, "\ufdd0'board", null);
  return cljs.core.reduce.call(null, cljs.core._PLUS_, cljs.core.map.call(null, function(row) {
    return cljs.core.count.call(null, cljs.core.filter.call(null, cljs.core.PersistentHashSet.fromArray(["\ufdd0'e"]), row))
  }, board__6444))
};
aima_clojure.games.tic_tac_toe.line = function line(p__6447, p__6448, p__6449) {
  var map__6466__6469 = p__6447;
  var map__6466__6470 = cljs.core.seq_QMARK_.call(null, map__6466__6469) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6466__6469) : map__6466__6469;
  var state__6471 = map__6466__6470;
  var board__6472 = cljs.core._lookup.call(null, map__6466__6470, "\ufdd0'board", null);
  var to_move__6473 = cljs.core._lookup.call(null, map__6466__6470, "\ufdd0'to-move", null);
  var vec__6467__6474 = p__6448;
  var y__6475 = cljs.core.nth.call(null, vec__6467__6474, 0, null);
  var x__6476 = cljs.core.nth.call(null, vec__6467__6474, 1, null);
  var move__6477 = vec__6467__6474;
  var vec__6468__6478 = p__6449;
  var y_diff__6479 = cljs.core.nth.call(null, vec__6468__6478, 0, null);
  var x_diff__6480 = cljs.core.nth.call(null, vec__6468__6478, 1, null);
  var direction__6481 = vec__6468__6478;
  return cljs.core.map.call(null, function(n) {
    return cljs.core.PersistentVector.fromArray([y__6475 + y_diff__6479 * n, x__6476 + x_diff__6480 * n], true)
  }, cljs.core.iterate.call(null, cljs.core.inc, 1))
};
aima_clojure.games.tic_tac_toe.k_in_row_QMARK_ = function k_in_row_QMARK_(p__6483, move, p__6484, k) {
  var map__6497__6499 = p__6483;
  var map__6497__6500 = cljs.core.seq_QMARK_.call(null, map__6497__6499) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6497__6499) : map__6497__6499;
  var state__6501 = map__6497__6500;
  var board__6502 = cljs.core._lookup.call(null, map__6497__6500, "\ufdd0'board", null);
  var to_move__6503 = cljs.core._lookup.call(null, map__6497__6500, "\ufdd0'to-move", null);
  var vec__6498__6504 = p__6484;
  var y_diff__6505 = cljs.core.nth.call(null, vec__6498__6504, 0, null);
  var x_diff__6506 = cljs.core.nth.call(null, vec__6498__6504, 1, null);
  var direction__6507 = vec__6498__6504;
  var opposite_direction__6508 = cljs.core.PersistentVector.fromArray([-y_diff__6505, -x_diff__6506], true);
  return cljs.core.count.call(null, cljs.core.concat.call(null, cljs.core.take_while.call(null, function(p1__6445_SHARP_) {
    return cljs.core._EQ_.call(null, to_move__6503, cljs.core.get_in.call(null, board__6502, p1__6445_SHARP_))
  }, aima_clojure.games.tic_tac_toe.line.call(null, state__6501, move, direction__6507)), cljs.core.take_while.call(null, function(p1__6446_SHARP_) {
    return cljs.core._EQ_.call(null, to_move__6503, cljs.core.get_in.call(null, board__6502, p1__6446_SHARP_))
  }, aima_clojure.games.tic_tac_toe.line.call(null, state__6501, move, opposite_direction__6508)))) >= k - 1
};
aima_clojure.games.tic_tac_toe.calculate_utility = function calculate_utility(p__6509, move, k) {
  var map__6515__6516 = p__6509;
  var map__6515__6517 = cljs.core.seq_QMARK_.call(null, map__6515__6516) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6515__6516) : map__6515__6516;
  var state__6518 = map__6515__6517;
  var to_move__6519 = cljs.core._lookup.call(null, map__6515__6517, "\ufdd0'to-move", null);
  if(cljs.core.truth_(cljs.core.some.call(null, function(p1__6482_SHARP_) {
    return aima_clojure.games.tic_tac_toe.k_in_row_QMARK_.call(null, state__6518, move, p1__6482_SHARP_, k)
  }, cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray([0, 1], true), cljs.core.PersistentVector.fromArray([1, 0], true), cljs.core.PersistentVector.fromArray([1, -1], true), cljs.core.PersistentVector.fromArray([1, 1], true)], true)))) {
    if(cljs.core._EQ_.call(null, to_move__6519, "\ufdd0'x")) {
      return 1
    }else {
      return-1
    }
  }else {
    return 0
  }
};
aima_clojure.games.tic_tac_toe.s = cljs.core.ObjMap.fromObject(["\ufdd0'to-move", "\ufdd0'board", "\ufdd0'utility"], {"\ufdd0'to-move":"\ufdd0'x", "\ufdd0'board":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["\ufdd0'o", "\ufdd0'e", "\ufdd0'x"], true), cljs.core.PersistentVector.fromArray(["\ufdd0'e", "\ufdd0'x", "\ufdd0'e"], true), cljs.core.PersistentVector.fromArray(["\ufdd0'o", "\ufdd0'x", "\ufdd0'e"], true)], true), "\ufdd0'utility":0});
aima_clojure.games.tic_tac_toe.empty_count.call(null, aima_clojure.games.tic_tac_toe.s);
cljs.core.take.call(null, 5, aima_clojure.games.tic_tac_toe.line.call(null, aima_clojure.games.tic_tac_toe.s, cljs.core.PersistentVector.fromArray([0, 1], true), cljs.core.PersistentVector.fromArray([0, 1], true)));
aima_clojure.games.tic_tac_toe.calculate_utility.call(null, aima_clojure.games.tic_tac_toe.s, cljs.core.PersistentVector.fromArray([0, 1], true), 3);
aima_clojure.games.tic_tac_toe.tic_tac_toe = function() {
  var tic_tac_toe = null;
  var tic_tac_toe__0 = function() {
    return tic_tac_toe.call(null, cljs.core.ObjMap.EMPTY)
  };
  var tic_tac_toe__1 = function(p__6520) {
    var map__6568__6569 = p__6520;
    var map__6568__6570 = cljs.core.seq_QMARK_.call(null, map__6568__6569) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6568__6569) : map__6568__6569;
    var k__6571 = cljs.core._lookup.call(null, map__6568__6570, "\ufdd0'k", 3);
    var v__6572 = cljs.core._lookup.call(null, map__6568__6570, "\ufdd0'v", 3);
    var h__6573 = cljs.core._lookup.call(null, map__6568__6570, "\ufdd0'h", 3);
    if(void 0 === aima_clojure.games.tic_tac_toe.t6574) {
      aima_clojure.games.tic_tac_toe.t6574 = function(h, v, k, map__6568, p__6520, tic_tac_toe, meta6575) {
        this.h = h;
        this.v = v;
        this.k = k;
        this.map__6568 = map__6568;
        this.p__6520 = p__6520;
        this.tic_tac_toe = tic_tac_toe;
        this.meta6575 = meta6575;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 393216
      };
      aima_clojure.games.tic_tac_toe.t6574.cljs$lang$type = true;
      aima_clojure.games.tic_tac_toe.t6574.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
        return cljs.core.list.call(null, "aima-clojure.games.tic-tac-toe/t6574")
      };
      aima_clojure.games.tic_tac_toe.t6574.prototype.aima_clojure$game$Game$ = true;
      aima_clojure.games.tic_tac_toe.t6574.prototype.aima_clojure$game$Game$moves$arity$2 = function(game, state) {
        var this__6577 = this;
        var iter__2517__auto____6598 = function iter__6578(s__6579) {
          return new cljs.core.LazySeq(null, false, function() {
            var s__6579__6590 = s__6579;
            while(true) {
              if(cljs.core.seq.call(null, s__6579__6590)) {
                var y__6591 = cljs.core.first.call(null, s__6579__6590);
                var iterys__2515__auto____6596 = function(s__6579__6590, y__6591) {
                  return function iter__6580(s__6581) {
                    return new cljs.core.LazySeq(null, false, function(s__6579__6590, y__6591) {
                      return function() {
                        var s__6581__6594 = s__6581;
                        while(true) {
                          if(cljs.core.seq.call(null, s__6581__6594)) {
                            var x__6595 = cljs.core.first.call(null, s__6581__6594);
                            if(cljs.core._EQ_.call(null, "\ufdd0'e", cljs.core.get_in.call(null, (new cljs.core.Keyword("\ufdd0'board")).call(null, state), cljs.core.PersistentVector.fromArray([y__6591, x__6595], true)))) {
                              return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([y__6591, x__6595], true), iter__6580.call(null, cljs.core.rest.call(null, s__6581__6594)))
                            }else {
                              var G__6615 = cljs.core.rest.call(null, s__6581__6594);
                              s__6581__6594 = G__6615;
                              continue
                            }
                          }else {
                            return null
                          }
                          break
                        }
                      }
                    }(s__6579__6590, y__6591), null)
                  }
                }(s__6579__6590, y__6591);
                var fs__2516__auto____6597 = cljs.core.seq.call(null, iterys__2515__auto____6596.call(null, cljs.core.range.call(null, this__6577.h)));
                if(fs__2516__auto____6597) {
                  return cljs.core.concat.call(null, fs__2516__auto____6597, iter__6578.call(null, cljs.core.rest.call(null, s__6579__6590)))
                }else {
                  var G__6616 = cljs.core.rest.call(null, s__6579__6590);
                  s__6579__6590 = G__6616;
                  continue
                }
              }else {
                return null
              }
              break
            }
          }, null)
        };
        return iter__2517__auto____6598.call(null, cljs.core.range.call(null, this__6577.v))
      };
      aima_clojure.games.tic_tac_toe.t6574.prototype.aima_clojure$game$Game$make_move$arity$3 = function(game, p__6599, move) {
        var this__6600 = this;
        var map__6601__6602 = p__6599;
        var map__6601__6603 = cljs.core.seq_QMARK_.call(null, map__6601__6602) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6601__6602) : map__6601__6602;
        var state__6604 = map__6601__6603;
        var board__6605 = cljs.core._lookup.call(null, map__6601__6603, "\ufdd0'board", null);
        var to_move__6606 = cljs.core._lookup.call(null, map__6601__6603, "\ufdd0'to-move", null);
        return cljs.core.ObjMap.fromObject(["\ufdd0'to-move", "\ufdd0'board", "\ufdd0'utility"], {"\ufdd0'to-move":cljs.core._EQ_.call(null, "\ufdd0'o", to_move__6606) ? "\ufdd0'x" : "\ufdd0'o", "\ufdd0'board":cljs.core.assoc_in.call(null, board__6605, move, to_move__6606), "\ufdd0'utility":aima_clojure.games.tic_tac_toe.calculate_utility.call(null, state__6604, move, this__6600.k)})
      };
      aima_clojure.games.tic_tac_toe.t6574.prototype.aima_clojure$game$Game$utility$arity$3 = function(game, state, player) {
        var this__6607 = this;
        return aima_clojure.games.tic_tac_toe.empty_count.call(null, state) * (cljs.core._EQ_.call(null, player, "\ufdd0'x") ? (new cljs.core.Keyword("\ufdd0'utility")).call(null, state) : -(new cljs.core.Keyword("\ufdd0'utility")).call(null, state))
      };
      aima_clojure.games.tic_tac_toe.t6574.prototype.aima_clojure$game$Game$terminal_test$arity$2 = function(game, state) {
        var this__6608 = this;
        var or__3824__auto____6609 = cljs.core.not_EQ_.call(null, 0, (new cljs.core.Keyword("\ufdd0'utility")).call(null, state));
        if(or__3824__auto____6609) {
          return or__3824__auto____6609
        }else {
          return cljs.core.empty_QMARK_.call(null, game.aima - clojure$game$Game$moves$arity$2(game, state))
        }
      };
      aima_clojure.games.tic_tac_toe.t6574.prototype.aima_clojure$game$Game$to_move$arity$2 = function(game, state) {
        var this__6610 = this;
        return(new cljs.core.Keyword("\ufdd0'to-move")).call(null, state)
      };
      aima_clojure.games.tic_tac_toe.t6574.prototype.aima_clojure$game$Game$display$arity$2 = function(game, state) {
        var this__6611 = this;
        return clojure.pprint.pprint.call(null, (new cljs.core.Keyword("\ufdd0'board")).call(null, state))
      };
      aima_clojure.games.tic_tac_toe.t6574.prototype.aima_clojure$game$Game$initial$arity$1 = function(game) {
        var this__6612 = this;
        return cljs.core.ObjMap.fromObject(["\ufdd0'to-move", "\ufdd0'board", "\ufdd0'utility"], {"\ufdd0'to-move":"\ufdd0'x", "\ufdd0'board":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["\ufdd0'e", "\ufdd0'e", "\ufdd0'e"], true), cljs.core.PersistentVector.fromArray(["\ufdd0'e", "\ufdd0'e", "\ufdd0'e"], true), cljs.core.PersistentVector.fromArray(["\ufdd0'e", "\ufdd0'e", "\ufdd0'e"], true)], true), "\ufdd0'utility":0})
      };
      aima_clojure.games.tic_tac_toe.t6574.prototype.cljs$core$IMeta$_meta$arity$1 = function(_6576) {
        var this__6613 = this;
        return this__6613.meta6575
      };
      aima_clojure.games.tic_tac_toe.t6574.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_6576, meta6575) {
        var this__6614 = this;
        return new aima_clojure.games.tic_tac_toe.t6574(this__6614.h, this__6614.v, this__6614.k, this__6614.map__6568, this__6614.p__6520, this__6614.tic_tac_toe, meta6575)
      };
      aima_clojure.games.tic_tac_toe.t6574
    }else {
    }
    return new aima_clojure.games.tic_tac_toe.t6574(h__6573, v__6572, k__6571, map__6568__6570, p__6520, tic_tac_toe, null)
  };
  tic_tac_toe = function(p__6520) {
    switch(arguments.length) {
      case 0:
        return tic_tac_toe__0.call(this);
      case 1:
        return tic_tac_toe__1.call(this, p__6520)
    }
    throw"Invalid arity: " + arguments.length;
  };
  tic_tac_toe.cljs$lang$arity$0 = tic_tac_toe__0;
  tic_tac_toe.cljs$lang$arity$1 = tic_tac_toe__1;
  return tic_tac_toe
}();
aima_clojure.games.tic_tac_toe._main = function _main() {
  return cljs.core.println.call(null, cljs.core.take.call(null, 3, aima_clojure.games.tic_tac_toe.line.call(null, aima_clojure.games.tic_tac_toe.s, cljs.core.PersistentVector.fromArray([2, 0], true), cljs.core.PersistentVector.fromArray([-1, 0], true))))
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.userAgent.isDocumentModeCache_ = {};
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.isDocumentModeCache_[documentMode] || (goog.userAgent.isDocumentModeCache_[documentMode] = goog.userAgent.IE && document.documentMode && document.documentMode >= documentMode)
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isDocumentMode(9) || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            if(goog.string.startsWith(key, "aria-")) {
              element.setAttribute(key, val)
            }else {
              element[key] = val
            }
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isElement = function(obj) {
  return goog.isObject(obj) && obj.nodeType == goog.dom.NodeType.ELEMENT
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc = frame.contentDocument || frame.contentWindow.document;
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    var child = root.firstChild;
    while(child) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
      child = child.nextSibling
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0 && index < 32768
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.tabIndex = -1;
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.dom.BrowserFeature.CAN_USE_INNER_TEXT) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.getActiveElement = function(doc) {
  try {
    return doc && doc.activeElement
  }catch(e) {
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestorByClass = goog.dom.getAncestorByClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__10624 = s;
      var limit__10625 = limit;
      var parts__10626 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__10625, 1)) {
          return cljs.core.conj.call(null, parts__10626, s__10624)
        }else {
          var temp__3971__auto____10627 = cljs.core.re_find.call(null, re, s__10624);
          if(cljs.core.truth_(temp__3971__auto____10627)) {
            var m__10628 = temp__3971__auto____10627;
            var index__10629 = s__10624.indexOf(m__10628);
            var G__10630 = s__10624.substring(index__10629 + cljs.core.count.call(null, m__10628));
            var G__10631 = limit__10625 - 1;
            var G__10632 = cljs.core.conj.call(null, parts__10626, s__10624.substring(0, index__10629));
            s__10624 = G__10630;
            limit__10625 = G__10631;
            parts__10626 = G__10632;
            continue
          }else {
            return cljs.core.conj.call(null, parts__10626, s__10624)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__10636 = s.length;
  while(true) {
    if(index__10636 === 0) {
      return""
    }else {
      var ch__10637 = cljs.core._lookup.call(null, s, index__10636 - 1, null);
      if(function() {
        var or__3824__auto____10638 = cljs.core._EQ_.call(null, ch__10637, "\n");
        if(or__3824__auto____10638) {
          return or__3824__auto____10638
        }else {
          return cljs.core._EQ_.call(null, ch__10637, "\r")
        }
      }()) {
        var G__10639 = index__10636 - 1;
        index__10636 = G__10639;
        continue
      }else {
        return s.substring(0, index__10636)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__10643 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____10644 = cljs.core.not.call(null, s__10643);
    if(or__3824__auto____10644) {
      return or__3824__auto____10644
    }else {
      var or__3824__auto____10645 = cljs.core._EQ_.call(null, "", s__10643);
      if(or__3824__auto____10645) {
        return or__3824__auto____10645
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__10643)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__10652 = new goog.string.StringBuffer;
  var length__10653 = s.length;
  var index__10654 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__10653, index__10654)) {
      return buffer__10652.toString()
    }else {
      var ch__10655 = s.charAt(index__10654);
      var temp__3971__auto____10656 = cljs.core._lookup.call(null, cmap, ch__10655, null);
      if(cljs.core.truth_(temp__3971__auto____10656)) {
        var replacement__10657 = temp__3971__auto____10656;
        buffer__10652.append([cljs.core.str(replacement__10657)].join(""))
      }else {
        buffer__10652.append(ch__10655)
      }
      var G__10658 = index__10654 + 1;
      index__10654 = G__10658;
      continue
    }
    break
  }
};
goog.provide("aima_clojure.tictactoe_frontend");
goog.require("cljs.core");
goog.require("aima_clojure.game");
goog.require("aima_clojure.games.tic_tac_toe");
goog.require("goog.dom");
goog.require("clojure.string");
aima_clojure.tictactoe_frontend.log = function log(str) {
  return console.log(str)
};
aima_clojure.tictactoe_frontend.tic_tac_toe = aima_clojure.games.tic_tac_toe.tic_tac_toe.call(null);
aima_clojure.tictactoe_frontend.terminal_test = aima_clojure.game.terminal_test;
aima_clojure.tictactoe_frontend.log.call(null, cljs.core._EQ_.call(null, aima_clojure.tictactoe_frontend.terminal_test.call(null, aima_clojure.tictactoe_frontend.tic_tac_toe, cljs.core.ObjMap.fromObject(["\ufdd0'to-move", "\ufdd0'board", "\ufdd0'utility"], {"\ufdd0'to-move":"\ufdd0'x", "\ufdd0'board":cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray(["\ufdd0'x", "\ufdd0'e", "\ufdd0'e"], true), cljs.core.PersistentVector.fromArray(["\ufdd0'o", "\ufdd0'o", "\ufdd0'e"], true), 
cljs.core.PersistentVector.fromArray(["\ufdd0'x", "\ufdd0'e", "\ufdd0'e"], true)], true), "\ufdd0'utility":0}))));

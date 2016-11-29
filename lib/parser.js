var sax = require('sax');

module.exports = initParser;
module.exports.addChild = addChild;
module.exports.appendToCollection = appendToCollection;

function addChild(name) {
  return function(node, parent) {
    if (parent[name]) {
      return;
    }
    var child = {};
    parent[name] = child;
    return child;
  };
}

function appendToCollection(name) {
  return function(node, parent) {
    var child = {};

    if (!parent[name]) {
      parent[name] = [];
    }
    parent[name].push(child);
    return child;
  };
}

function stack(init) {
  var items = [init];
  var names = [];

  return {
    pop: function(name) {
      if (names[names.length - 1] === name) {
        names.pop();
        return items.pop();
      }
    },
    push: function(item, name) {
      names.push(name);
      return items.push(item);
    },
    top: function() { return items[items.length - 1]; }
  };
}

// used to mark all tags that we want to skip
var IGNORE = Object.create(null);


function stripPrefix(name) {
  var index = name.indexOf(':');
  return index < 0 ? name : name.slice(index + 1);
}

function initParser(strict, saxOptions, parserConfig, fn) {
  var stream = sax.createStream(strict, saxOptions);
  var
    items = stack({}),
    parsers = stack(parserConfig),
    context = {};

  stream.on('opentag', function(node) {
    var tag = node.local;
    var tagParser = verifyNS(parsers.top()[tag]);
    var elem;

    function parseWith(tp) {
      elem = tp(node, items.top(), context);
      if (elem) {
        items.push(elem, tag);
      }
    }

    // if parser specifies namespace, it has to much naode namespace
    function verifyNS(tp) {
      if (!tp) {
        return tp;
      }
      if (!tp.$uri) {
        return tp;
      }
      if (tp.$uri === node.uri) {
        return tp;
      }
    }

    if (!tagParser) {
      parsers.push(IGNORE, tag);
      return;
    }
    if (typeof tagParser === 'function') {
      parseWith(tagParser);
    } else {
      if (typeof tagParser.$ === 'function') {
        parseWith(tagParser.$);
      }
      parsers.push(tagParser, tag);
    }
  });

  stream.on('closetag', function(tag) {
    var parser;

    tag = stripPrefix(tag);
    parser = parsers.pop(tag);
    if (parser && typeof parser.$after === 'function') {
      parser.$after(items.top(), context);
    }
    if (parser !== IGNORE) {
      items.pop(tag);
    }
  });

  stream.on('text', function(value) {
    var textParser = parsers.top().$text;
    if (textParser) {
      textParser(value, items.top(), context);
    }
  });

  stream.on('error', function(err) {
    fn(err, items.top());
  });

  stream.on('end', function() {
    fn(null, items.top());
  });

  return stream;
}


var urlModule = require('url');
var https = require('https');
var queryString = require('querystring');

exports.assign = function (target) {
    var i, l;
    for (i = 1, l = arguments.length; i < l; i++) {
        var arg = arguments[i];
        var key;
        for (key in arg) {
            target[key] = arg[key];
        }
    }
    return target;
};

exports.request = function request(robot, url) {
    var result = robot.http(url);
    var original = result.request;
    var maxRedirects = 0;

    result.maxRedirects = function (n) {
        maxRedirects = n;
        return this;
    };

    result.request = function () {
        var run = original.apply(this, arguments);
        return new Promise(function (resolve, reject) {
            run(function (error, res, body) {
                if (error) return reject(error);
                if (maxRedirects > 0 && res.headers.location && res.statusCode >= 300 && res.statusCode < 400) {
                    var dest = urlModule.resolve(url, res.headers.location);
                    exports.request(robot, dest)
                    .maxRedirects(maxRedirects - 1)
                    .get()
                    .then(resolve, reject);
                }
                else {
                    res.body = body;
                    res.url = url;
                    resolve(res);
                }
            });
        });
    };

    return result;
};


exports.parseLines = function (lines) {
    var result = [];
    if (lines) {
        for (var line of lines.split('\n')) {
            line = line.trim();
            if (line) result.push(line);
        }
    }
    return result;
};

exports.parseKeyValues = function (lines) {
    var result = new Map();
    for (var line of exports.parseLines(lines)) {
        var match = line.match(/(.*?)=(.*)/);
        if (match) {
            result.set(match[1].trim(), match[2].trim());
        }
    }
    return result;
};

exports.glob = function glob(s, options) {
    var regex = s
    .replace(/\\/g, '\\\\')
    .replace(/([\-.*+\?\^$()\[\]{}|])/g, '\\$1')
    .replace(/\\\*/g, '.*')
    .replace(/\\\?/g, '.')
    .replace(/\\\{/g, '(')
    .replace(/\\\}/g, ')')
    .replace(/,/g, '|');

    return new RegExp('^' + regex + '$', options);
};


var ignoredUsers = new Set(exports.parseLines(process.env.HUBOT_IGNORE_USER));

exports.isUserIgnored = function isUserIgnored(msg) {
    return ignoredUsers.has(msg.message.user.name);
};

var ignoredURLs = exports.glob(exports.parseLines(process.env.HUBOT_IGNORE_URL).join(','));

exports.isURLIgnored = function isURLIgnored(url) {
    return ignoredURLs.test(url);
};

exports.requireEnv = function requireEnv(name) {
    if (!process.env[name]) throw new Error('No ' + name + ' set.');
    return process.env[name];
};

exports.urlregex = /\b(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)[-A-Z0-9+&@#/%=~_|$?!:,.]*[A-Z0-9+&@#/%=~_|$]/ig;

exports.extendURLs = function extendURLs(robot, text) {
    var promises = [];
    var count = 0;
    var token = Math.floor(Math.random() * 1e10) + '###';
    text = text.replace(exports.urlregex, function (url) {
        var thisTocken = token + count;
        count++;
        var promise = exports.extendURL(robot, url)
        .then(function (url) {text = text.replace(thisTocken, url); });
        promises.push(promise);
        return thisTocken;
    });

    return Promise.all(promises).then(function () {
        return text;
    });
};

exports.extendURL = function extendURL(robot, url) {
    return exports.request(robot, url)
        .maxRedirects(10)
        .head()
        .catch(function () { return { url: url }; })
        .then(function (res) { return res.url; });
};


var strftimeCallbacks = {
    '%%': function () { return '%'; },
    '%H': function (d) { return pad(d.getHours(), '00'); },
    '%M': function (d) { return pad(d.getMinutes(), '00'); },
    '%S': function (d) { return pad(d.getSeconds(), '00'); },
    '%Y': function (d) { return pad(d.getFullYear(), '0000'); },
    '%m': function (d) { return pad(d.getMonth() + 1, '00'); },
    '%d': function (d) { return pad(d.getDate(), '00'); },
};

function pad(s, chars) {
    return (chars + s).slice(-chars.length);
}

exports.strftime = function (date, format) {
    return format.replace(/%./g, function (s) {
        return strftimeCallbacks[s] ? strftimeCallbacks[s](date) : s;
    });
};




var hp = require('htmlparser2');
var CSSselect = require('css-select');
var decodeHTML = require('entities').decodeHTML;

exports.domSelect = function (dom, selector) {
    return CSSselect.selectOne(selector, dom);
};

exports.domSelectAll = function (dom, selector) {
    return CSSselect(selector, dom);
};


var blockTags = ['div', 'p', 'br'];

function getHTMLText(node) {
    if (!node) {
        return '';
    }

    if (Array.isArray(node)) {
        return node.map(getHTMLText).join('');
    }

    if (node.type === 'text') {
        return node.data;
    }

    var text = node.children ? getHTMLText(node.children) : '';

    if (node.type === 'tag' && blockTags.indexOf(node.name) >= 0) {
        text = '¶' + text + '¶';
    }

    return text;
}
exports.domGetText = function (dom) {
    return decodeHTML(getHTMLText(dom).replace(/\s+/g, ' ').replace(/¶+/g, '\n').replace(/\s*\n+\s*/g, '\n').trim());
};

exports.domParse = function (body) {
    return hp.parseDOM(body);
};

exports.decodeHTML = decodeHTML;

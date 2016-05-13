// Description:
//   Can i use
//
// Dependencies:
//
// Configuration:
//
// Commands:
//   hubot can i use <query> - get browser support on caniuse.com and kangax compat-tables
//
// Notes:
//
// Author:
//   alk

var util = require('../util');
var vm = require('vm');

module.exports = function (robot) {

    var cache;
    var cacheDate;

    function handleDataFetchError(e) {
        console.log('Caniuse error: ' + (e.stack || e));
    }

    function stripTags(s) {
        return s.replace(/<.*?>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<');
    }

    function capitalize(s) {
        return s[0].toUpperCase() + s.slice(1);
    }

    function getCaniuseData() {
        function cmpVersions(a, b) { return parseInt(a) - parseInt(b); }
        return util.request(robot, 'https://raw.githubusercontent.com/Fyrd/caniuse/master/data.json')
        .get()
        .then(function (res) {
            var data = JSON.parse(res.body).data;
            return Object.keys(data).map(function (feature) {
                var stats = data[feature].stats;
                var support = {};
                for (var browser in stats) {
                    var versions = [];
                    for (var version in stats[browser]) {
                        if (stats[browser][version][0] === 'y') {
                            versions.push(version);
                        }
                    }
                    versions.sort(cmpVersions);
                    if (versions[0]) {
                        support[browser] = capitalize(browser) + ' ' + version;
                    }
                }
                return {
                    title: data[feature].title,
                    id: feature,
                    support: support,
                    link: 'http://caniuse.com/#feat=' + feature,
                };
            });
        })
        .catch(handleDataFetchError);
    }

    function getCompatData(which) {
        return util.request(robot, 'https://raw.githubusercontent.com/kangax/compat-table/gh-pages/data-' + which + '.js')
        .get()
        .then(function (res) {
            var module = { exports: {} };

            vm.runInNewContext(res.body, {
                module: module,
                exports: module.exports,
                require: function (what) {
                    if (what === 'object-assign') return util.assign;
                }
            });


            return module.exports.tests.map(function (test) {
                var browsers = {};
                function setBrowser(res) {
                    for (var browser in res) {
                        if (res[browser] === true || (res[browser] && res[browser].val === true)) {
                            var browserInfos = module.exports.browsers[browser];
                            if (!browserInfos) {
                                browserInfos = { short: browser };
                            }
                            browsers[browser.match(/[a-z_]+/)[0]] = stripTags(browserInfos.short);
                        }
                    }
                }
                if (test.res) {
                    setBrowser(test.res);
                }
                else if (test.subtests) {
                    for (var subtest in test.subtests) {
                        setBrowser(test.subtests[subtest].res);
                    }
                }
                return {
                    title: test.name,
                    support: browsers,
                    link: 'http://kangax.github.io/compat-table/' + which + '/#' +
                        test.name.replace(/^[\s<>&"]+|[\s<>&"]+$/g, '').replace(/[\s<>&"]+/g, '_')
                };
            });
        })
        .catch(handleDataFetchError);
    }

    function getData() {
        if (!cache || !cacheDate || cacheDate < Date.now() - 86400e3) {
            return Promise.all([
                getCaniuseData(),
                getCompatData('es5'),
                getCompatData('es6'),
                getCompatData('es7'),
                getCompatData('non-standard'),
            ]).then(function (results) {
                var data = [];
                for (var list of results) {
                    if (list) {
                        data.push.apply(data, list);
                    }
                }
                cache = data;
                cacheDate = Date.now();
                return cache;
            });
        }

        return Promise.resolve(cache);
    }

    var browsers = [
        'chrome',
        'firefox',
        'ie',
        'safari',
        'node',
    ];

    function formatSupport(data) {
        var result = [];
        for (var browser of browsers) {
            if (data[browser]) {
                result.push(data[browser]);
            }
        }
        return result.join(' | ');
    }

    robot.respond(/can\s*i\s*use\s+(.*)/i, function (msg) {
        if (util.isUserIgnored(msg)) return;

        getData()
        .then(searchData)
        .catch(handleError);

        function searchData(data) {
            var query = util.glob('*' + msg.match[1].replace(/ /g, '*') + '*', 'i');
            var matches = [];

            for (var feature of data) {
                if (query.test(feature.title) || (feature.id && query.test(feature.id))) {
                    matches.push(feature);
                }
            }

            if (!matches.length) {
                msg.send('No result');
                return;
            }

            if (matches.length > 5) {
                matches.length = 5;
            }

            for (var match of matches) {
                msg.send(match.title + ': ' + formatSupport(match.support));
                msg.send(match.link);
            }
        }

        function handleError(error) {
            console.log(error.stack || error);
            msg.send('Uhoh, something went wrong (' + error + ')');
        }
  });
};

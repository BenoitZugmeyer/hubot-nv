// Description:
//   A hubot reddit plugin
//
// Dependencies:
//
// Configuration:
//
//   HUBOT_REDDIT_BLACKLIST  - comma separated list of blacklisted subreddit
//   HUBOT_REDDIT_ALLOW_NSFW - set it to 'false' to desactivate NSFW links
//
// Commands:
//
//   !r/(subreddit)[#(type)] - pick an item from a subreddit (type should be any or pic)
//   !r?(search)[#(type)]    - pick an item from a reddit search (type should be any, pic or sub)
//   !u/(user)               - pick an item from a reddit user submissions
//   !sauce [n]              - get last (or nth last) reddit link reddit
//
// Author:
//   alk

var util = require('../util');

var blacklist = new Set(util.parseLines(process.env.HUBOT_REDDIT_BLACKLIST));
var displayNSFW = process.env.HUBOT_REDDIT_ALLOW_NSFW !== 'false';

function isBlacklisted(sub) {
    return blacklist.has(sub.toLowerCase());
}


module.exports = function (robot) {

    function isAlreadySeen(url) {
        return (robot.brain.get('reddit_seen_urls') || {}).hasOwnProperty(url);
    }

    function setAlreadySeen(url) {
        var registry = robot.brain.get('reddit_seen_urls') || {};
        registry[url] = true;
        robot.brain.set('reddit_seen_urls', registry);
    }

    function storeSauce(sauce) {
        var registry = robot.brain.get('reddit_seen_sauces') || [];
        registry.unshift(sauce);
        registry.length = 10;
        robot.brain.set('reddit_seen_sauces', registry);
    }

    function getSauce(n) {
        return (robot.brain.get('reddit_seen_sauces') || [])[n];
    }

    function shuffle(o){ //v1.0
        for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    }

    function getElement(elements, type) {

        shuffle(elements);

        var match = type === 'any' ? /.*/ : /(jpg|gif|png)$/i;

        for (var element of elements) {
            var url = element.data.url;
            if (isBlacklisted(element.data.subreddit)) {
                continue;
            }
            if (isAlreadySeen(url)) {
                continue;
            }
            if (element.data.over_18 && !displayNSFW) {
                continue;
            }
            if (match.test(url)) {
                setAlreadySeen(url);
                storeSauce(element.data.permalink);
                return element.data;
            }
        }
    }

    robot.hear(/^!(u|r)(?:(\/|\?)(.+?)(?:#(any|url|pic|sub))?)?$/, function (msg) {
        var userName = msg.message.user.name;
        var category = msg.match[1];
        var isSearch = msg.match[2] === '?';
        var query = msg.match[3];
        var type = msg.match[4] || 'pic';

        var isSubredditSearch = isSearch && type === 'sub';
        var isBoardSearch = category === 'r';

        var queryURI = encodeURIComponent(query);

        var url;

        if (isBoardSearch) {
            if (isSubredditSearch) {
                url = 'https://www.reddit.com/subreddits/search.json?q=' + queryURI + '&limit=10';
            }
            else if (isSearch) {
                url = 'https://www.reddit.com/search.json?q=' + queryURI + '&limit=100';
            }
            else {
                if (type === 'sub') {
                    msg.send("Sorry, can't do that");
                    return;
                }
                if (isBlacklisted(query)) {
                    msg.send("Nope.");
                    return;
                }
                url = 'https://www.reddit.com/r/' + queryURI + '.json?limit=100';
            }
        }
        else {
            url = 'https://www.reddit.com/user/' + queryURI + '/submitted/.json?limit=100';
        }

        util.request(robot, url)
        .get()
        .then(handleResponse)
        .then(handleElements)
        .catch(handleError);

        function handleResponse(res) {
            var result = JSON.parse(res.body);
            if (result.error) {
                if (result.error === 404) {
                    throw new Error('Not found');
                }
                else {
                    throw new Error('Error ' + result.error);
                }
            }
            else if (!result.data || !result.data.children) {
                throw new Error('Wrong JSON result from the API');
            }
            return result.data.children;
        }

        function handleElements(elements) {
            if (isSubredditSearch) {
                if (!elements.length) {
                    msg.send("No subreddit for " + query + " search");
                }
                else {
                    var result = elements.map(function (element) { return element.data.display_name; }).join(', ');
                    msg.send("Subreddits for " + query + " search: " + result);
                }
            }
            else {
                var el = getElement(elements, type) || getElement(elements, 'any');
                if (!el) {
                    if (isSearch) {
                        msg.send("Sorry " + userName + ", no result for " + query);
                    }
                    else {
                        msg.send("Sorry " + userName + ", the subreddit " + query + " seems empty");
                    }
                }
                else {
                    var prefix = (el.over_18 ? 'NSFW - ' : '') + 'Random from ' + query;
                    var item = el.title + ' - ' + el.url;
                    var signature = "requested by " + userName;
                    if (isSearch) {
                        msg.send(prefix + " search: " + item + " (" + signature + ", from board " + el.subreddit + ")");
                    }
                    else {
                        msg.send(prefix + ": " + item + " (" + signature + ")");
                    }
                }
            }
        }

        function handleError(error) {
            console.log(error.stack || error);
            msg.send('Uhoh, something went wrong (' + error + ')');
        }
    });

    robot.hear(/^!sauce(?:\s+(\d+))?/, function (msg) {
        var n = Number(msg.match[1]) || 0;
        var sauce = getSauce(n);
        if (sauce) {
            msg.send('Sauce: https://www.reddit.com' + sauce);
        }
        else {
            msg.send('Sauce not found');
        }
    });
};

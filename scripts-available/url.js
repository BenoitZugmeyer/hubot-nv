// Description:
//   Provide some context on URLs
//
// Dependencies:
//    "css-select": "^1.0.0",
//    "entities": "^1.1.1",
//    "htmlparser2": "^3.8.2",
//
// Configuration:
//
// Commands:
//
// Notes:
//
// Author:
//   alk

var util = require('../util');
var glob = util.glob;

var validContentType = glob('text/{xhtml,html}{;*,}');


module.exports = function (robot) {

    function extractTitle(page) {
        return util.domGetText(util.domSelect(page, 'title'));
    }

    function extractOGInfos(page) {
        var metas = util.domSelectAll(page, 'meta[property^="og:"][content]');
        var result = {};
        for (var meta of metas) {
            result[meta.attribs.property.slice(3).toLowerCase()] = util.decodeHTML(meta.attribs.content);
        }
        return result;
    }

    function isSpoiler(msg) {
        return /spoil/i.test(msg);
    }


    var handlers = new Map();

    handlers.set(glob('http{s,}://twitter.com/*/status/*'), function (msg, page) {
        var infos = extractOGInfos(page);
        if (isSpoiler(infos.title)) return;
        if (infos.title && infos.description) {
            util.extendURLs(robot, infos.description).then(function (description) {
                var image = '';
                if (infos.image && infos['image:user_generated']) {
                    image = ' ' + infos.image;
                }
                msg.send(infos.title + ' “ ' + description.slice(1, -1) + ' ”' + image);
            });
        }
    });

    handlers.set(glob('http{s,}://open.spotify.com/*'), function (msg, page) {
        var infos = extractOGInfos(page);
        if (infos.description) {
            msg.send(infos.description);
        }
    });

    var showImage = [
        glob('http{s,}://instagram.com/p/*')
    ];

    function shouldShowImage(url) {
        return showImage.some(function (re) { return re.test(url); });
    }

    handlers.set(glob('*'), function (msg, page, res) {
        var infos = extractOGInfos(page);
        var title = infos.title || extractTitle(page);
        if (title) {
            if (isSpoiler(title)) return;
            var image = '';
            if (shouldShowImage(res.url) && infos.image && !glob('*{avatar,profile}*').test(infos.image)) {
                image = ' ' + infos.image;
            }
            msg.send(title + image);
        }
    });


    robot.hear(util.urlregex, function (msg) {
        if (util.isUserIgnored(msg) || isSpoiler(msg.message)) return;

        for (var url of msg.match) {
            if (!/^https?:\/\//.test(url)) {
                url = 'http://' + url;
            }

            if (util.isURLIgnored(url)) continue;

            util.request(robot, url)
            .maxRedirects(10)
            .head()
            .then(handleResponse)
            .then(sendMessages)
            .catch(handleError);
        }

        function handleResponse(res) {

            if (util.isURLIgnored(res.url)) return;

            // Do not download content of unknown content type
            if (validContentType.test(res.headers['content-type'])) {
                return util.request(robot, res.url).get();
            }
        }

        function sendMessages(res) {
            if (res) {
                var page = util.domParse(res.body);
                for (var re of handlers.keys()) {
                    if (re.test(res.url)) {
                        handlers.get(re)(msg, page, res);
                        break;
                    }
                }
            }
        }

        function handleError(error) {
            console.log(error.stack || error);
        }

  });
};

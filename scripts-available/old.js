// Description:
//   OLD!
//
// Dependencies:
//   None
//
// Configuration:
//
// Commands:
//   !url <query> <N> - search for the last url (or the Nth if N is specified) matching the query
//
// Notes:
//
// Author:
//   alk

var util = require('../util');

module.exports = function (robot) {
    function getRegistry(msg) {
        return robot.brain.get('old_urls_' + msg.message.room) || {};
    }

    function setRegistry(msg, registry) {
        robot.brain.set('old_urls_' + msg.message.room, registry);
    }

    robot.hear(util.urlregex, function (msg) {
        if (util.isUserIgnored(msg)) return;

        for (var url of msg.match) {
            if (!/^https?:\/\//.test(url)) {
                url = 'http://' + url;
            }

            if (util.isURLIgnored(url)) continue;

            util.extendURL(robot, url)
            .then(handleResponse)
            .catch(handleError);
        }

        function handleResponse(url) {

            if (util.isURLIgnored(url)) return;

            var registry = getRegistry(msg);

            if (!registry[url]) {
                registry[url] = [];
            }
            else {
                msg.send('Old');
            }

            registry[url].push({ date: Date.now(), user: msg.message.user.name });

            setRegistry(msg, registry);
        }

        function handleError(error) {
            console.log(error.stack || error);
        }
  });

  robot.hear(/^!url (.*?)\s*(\d*)$/, function (msg) {
      var search = util.glob('*' + msg.match[1] + '*');
      var urlOf = new WeakMap();

      var results = [];
      var registry = getRegistry(msg);
      var entry;
      for (var url in registry) {
          if (search.test(url)) {
              for (entry of registry[url]) {
                  urlOf.set(entry, url);
                  results.push(entry);
              }
          }
      }

      if (!results.length) {
          msg.send('No result');
          return;
      }

      results.sort(function (a, b) { return a.date - b.date; });
      var index = Number(msg.match[2]) - 1;
      if (index < 0 || index >= results.length) {
          index = results.length - 1;
      }

      entry = results[index];
      msg.send(
          urlOf.get(entry) + ' by ' + entry.user + ', ' +
          util.strftime(new Date(entry.date), '%d/%m/%Y %H:%M:%S') +
          ' (url ' + (index + 1) + ' / ' + results.length + ')');

  });
};


// Description:
//   Ligropoints rules
//
// Dependencies:
//
// Configuration:
//
// Commands:
//
//  !ligropoints         - prints the top 5
//  !ligropoints <nick>  - gives a ligropoint to someone
//  !ligropoint          - alias to !ligropoints
//  !lp                  - alias to !ligropoints
//
// Author:
//   alk

var util = require('../util');


module.exports = function (robot) {

    function getRegistry() {
        return robot.brain.get('ligropoints') || {};
    }

    function setRegistry(registry) {
        robot.brain.set('ligropoints', registry);
    }

    function add(nick) {
        var registry = getRegistry();
        if (registry.hasOwnProperty(nick)) {
            registry[nick] += 1;
        }
        else {
            registry[nick] = 1;
        }
        setRegistry(registry);
    }

    function getTop() {
        var registry = getRegistry();
        return Object.keys(registry)
            .sort(function (na, nb) { return registry[nb] - registry[na]; })
            .slice(0, 5)
            .map(function (nick) { return { nick: nick, points: registry[nick] } });
    }

    robot.hear(/^!(?:ligropoints|ligropoint|lp)(?:\s+(.{0,30}))?$/, function (msg) {

        if (util.isUserIgnored(msg)) return;

        if (msg.match[1]) {
            add(msg.match[1]);
            msg.send(msg.message.user.name + " gives a LigroPoint to " + msg.match[1]);
        }
        else {
            getTop().forEach(function (user, index) {
                msg.send((index + 1) + ": " + user.nick + " - " + user.points);
            });
        }
    });
};


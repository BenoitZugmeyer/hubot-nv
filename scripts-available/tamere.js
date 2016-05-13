// Description:
//   Vive les mamans
//
// Dependencies:
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

var messages = [
    "mdr",
    "lol",
    "xptdr ta blague",
    "trop lol",
    "trop marrant",
    "on se marre bien",
    "trop drole",
    "rofl",
    "lmfao",
    "xD xD",
    "habile!",
    "il fallait y penser !",
    "ha le calembour !",
    "hahaha",
    "MUhhauuhauhahahuahuahuhauhauaua",
];

function spam(robot, name, messages, n) {
    if (!robot.adapter.notice) return;
    var message = messages.splice(Math.floor(Math.random() * messages.length), 1)[0];
    robot.adapter.notice({ user: { name: name } }, message);
    if (n > 0) {
        setTimeout(spam.bind(null, robot, name, messages, n-1), 10000 * Math.random());
    }
}

module.exports = function (robot) {
    robot.hear(/\bta (m[èe]re|maman)\b/ig, function (msg) {
        if (util.isUserIgnored(msg)) return;
        msg.send(msg.message.user.name + ': http://i.imgur.com/TMmlKMJ.gif');
        spam(robot, msg.message.user.name, messages.slice(), 5);
    });
};

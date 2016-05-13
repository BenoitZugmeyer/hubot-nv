// Description:
//   You deaf nigga?
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

module.exports = function (robot) {

    var previous = new Map();

    robot.hear(/^/, function (msg) {
        var input = msg.match.input;
        if (/^(wh?a+t|quoi)\s*(\?*)$/.test(input)) {
            var p = previous.get(msg.message.room);
            if (p) {
                msg.send('IL A DIT: "' + p.toUpperCase() + '", ' + msg.message.user.name);
            }
        }
        else {
            previous.set(msg.message.room, input);
        }
    });
};


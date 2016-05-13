// Description:
//   Bière!
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

module.exports = function (robot) {

    var count = 0;
    robot.hear(/bi[èe]re/ig, function (msg) {

        if (util.isUserIgnored(msg)) return;

        if (count % 5 === 4) {
            msg.send('Tu bois une bière tu fais pipi');
        } else if (count % 11 === 10) {
            msg.send('Tu manges une chips');
        } else {
            msg.send(msg.match.map(function () { return 'pipi'; }).join(''));
        }
        count++;
  });
};

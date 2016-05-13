// Description:
//   Send messages at some dates
//
// Dependencies:
//   "cron": "1.0.6",
//
// Configuration:
//   HUBOT_MESSAGE_TIMER
//   each line should be formated like that:
//   {cron time definition} {comma separated rooms} {message to send}
//
//   The cron time definition should have six fields:
//   {seconds} {minutes} {hours} {day of month} {months} {day of week}
//   and can contain ranges (1-5), enumerations (1,3) and steps (*/2)
//
//   Example:
//   HUBOT_MESSAGE_TIMER='
//   0 0 10 * * *  #general,#other  Good morning!
//   '
//
// Commands:
//
// Notes:
//
// Author:
//   alk

var CronJob = require('cron').CronJob;
var util = require('../util');

module.exports = function (robot) {
    var messages = util.parseLines(process.env.HUBOT_MESSAGE_TIMER);

    function createCron(time, rooms, text) {
        new CronJob({
            cronTime: time,
            onTick: function () {
                for (var room of rooms) robot.messageRoom(room, text);
            },
            start: true
        });
    }

    for (var line of messages) {
        var message = line.match(/^((?:\S+\s+){6})(\S+)\s+(.*)$/);

        if (!message) {
            console.log('Invalid HUBOT_MESSAGE_TIMER line: ' + line);
            continue;
        }

        var time = message[1];
        var rooms = message[2].split(/,/);
        var text = message[3];

        try {
            createCron(time, rooms, text);
        } catch (e) {
            console.log('Invalid HUBOT_MESSAGE_TIMER cron time definition for line ' + line + ': ' + e);
        }
    }
};



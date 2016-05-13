// Description:
//   Popchef menu
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

module.exports = function (robot) {

    var dates = new Map();

    robot.hear(/^!popchef$/, function (msg) {
        var lastTime = dates.get(msg.message.room);
        if (lastTime && lastTime >= Date.now() - 30 * 60000) {
            msg.send('Just scroll up, or go to https://eatpopchef.com');
            return;
        }

        util.request(robot, 'https://eatpopchef.com/api/schedules/now')
        .get()
        .then(handleResponse)
        .catch(handleError);

        function handleResponse(response) {
            if (!response.body) {
                msg.send('Rien à manger en ce moment :(');
                return;
            }

            var infos = JSON.parse(response.body);
            var localInfos = infos.find((info) => info.zoneId === 1);
            var meals = localInfos.dishes.concat(localInfos.sides);
            dates.set(msg.message.room, Date.now());
            for (var meal of meals) {
                msg.send(meal.title + ': ' +
                         meal.price + '€, ' +
                         'reste ' + meal.quantity + '    ' +
                         meal.picture);
            }
        }

        function handleError(error) {
            console.log(error.stack || error);
        }
    });

};




// Description:
//   Est-ce que c'est bientôt le weekend ?
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

    robot.hear(/^!weekend$/, function (msg) {
        util.request(robot, 'http://estcequecestbientotleweekend.fr')
        .get()
        .then(handleResponse)
        .catch(handleError);

        function handleResponse(response) {
            var dom = util.domParse(response.body);
            var result = util.domGetText(util.domSelectAll(dom, 'p.msg'));
            msg.send(result);
        }

        function handleError(error) {
            console.log(error.stack || error);
        }
    });

};



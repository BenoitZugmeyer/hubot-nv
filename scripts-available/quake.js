// Description:
//   Make teams
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
//   flo

// http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


module.exports = function (robot) {

    robot.hear(/^!quake/, function (msg) {
        var input = msg.match.input;
        var names = shuffle(input.split(/\s+/).slice(1));
        msg.send('TEAM 1: ' + names.slice(0, Math.ceil(names.length/2)).join(' & '));
        msg.send('TEAM 2: ' + names.slice(Math.ceil(names.length/2)).join(' & '));
    });
};


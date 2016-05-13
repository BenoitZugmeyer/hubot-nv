// Description:
//   Get the movie or serie info and plot
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   !imdb [plot] movieName
// Notes:
//
// Author:
//   Savate

var util = require('../util');

module.exports = function (robot) {

    robot.hear(/^!imdb\s*(plot)*\s*(.*)/, function (msg) {
        if (!msg.match[2]) {
            msg.send("Please provide a movie name");
            return;
        }
        util.request(robot, 'http://www.omdbapi.com/?t=' + encodeURIComponent(msg.match[2]) + '&plot=short&r=json&tomatoes=true')
        .maxRedirects(10)
        .get()
        .then(handleResponse)
        .catch(handleError);

        function handleResponse(response) {
            var result, movie = JSON.parse(response.body);
            if (!movie.Title) {
                result = "Movie or series not found";
            } else {
                result = '"' + movie.Title + '" from ' + movie.Director + ', ' + movie.Year + '.';
                result += '\nTomatoes: ' + movie.tomatoMeter + '%, Imdb: ' + movie.imdbRating + '/10, Metascore: '+ movie.Metascore;
                if (msg.match[1]) {
                    result += '\n' + movie.Plot;
                }
                result += '\n'+ movie.Poster;
            }
            msg.send(result);
        }

        function handleError(error) {
            console.log(error.stack || error);
        }
    });

};



// Description:
//   Eval js script
//
// Dependencies:
//
// Configuration:
//
// Commands:
//   hubot eval <script> - eval some js script
//
// Notes:
//
// Author:
//   alk

var util = require('../util');
var nodeUtil = require('util');
var vm = require('vm');
var babel;

try {
    babel = require('babel');
}
catch (e) {}

module.exports = function (robot) {

    function compileCode(code) {

        if (babel) {
            code = babel.transform(code).code;
        }

        return new vm.Script(code);
    }

    function safeOutput(s) {
        s = String(s).replace(/(\n\r|\n|\r)\s*/g, ' ');
        if (s.length > 1000) {
            return s.slice(0, 997) + '...';
        }
        return s;
    }

    var sandboxes = new Map();

    robot.respond(/eval\s+(.*)/i, function (msg) {
        if (util.isUserIgnored(msg)) return;

        var sandbox;
        if (sandboxes.has(msg.message.room)) {
            sandbox = sandboxes.get(msg.message.room);
        }
        else {
            sandbox = {};
            sandbox.global = sandbox;
            vm.createContext(sandbox);
            sandboxes.set(msg.message.room, sandbox);
        }

        var code = msg.match[1];

        var script;
        try {
            script = compileCode('try { global.exports = ' + code + '\n } catch (e) { global.exception = e; }');
        } catch (e) {
            try {
                script = compileCode('try { global.exports = (function () { ' + code + '\n }()); } catch (e) { global.exception = e; }');
            } catch (e) {
                msg.send('Compile error: ' + safeOutput(String(e).split('\n')[0]));
                return;
            }
        }

        try {
            script.runInContext(sandbox, {
                displayErrors: false,
                timeout: 100
            });
        }
        catch (e) {
            msg.send('Run error: ' + safeOutput(e));
            return;
        }

        if (sandbox.exception) {
            msg.send('Error: ' + safeOutput(sandbox.exception));
        }
        else {
            msg.send(safeOutput(nodeUtil.inspect(sandbox.exports)));
        }
        sandbox.exception = null;
        sandbox.exports = null;
    });
};


# Description:
#   Send a message to irc via an http request
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Notes:
#   curl -u EXPRESS_USER:EXPRESS_PASSWORD -d notice=on -d 'msg=toto' http://ops.lan.netvibes.com:8090/hubot/send/chan
#   curl -u EXPRESS_USER:EXPRESS_PASSWORD -d 'msg=toto' http://ops.lan.netvibes.com:8090/hubot/send/chan
#   curl -u EXPRESS_USER:EXPRESS_PASSWORD -d 'color=red' -d 'msg=toto' http://ops.lan.netvibes.com:8090/hubot/send/chan
#
# Author:
#   ArnaudM

irc = require('irc')

module.exports = (robot) ->
    robot.router.post '/hubot/send/:room', (req, res) ->
        room = req.params.room
        if req.body.color?
            color = req.body.color
        else
           color = 'reset'
        msg = irc.colors.wrap(color, req.body.msg)
        if req.body.notice?
           robot.adapter.notice {room: "##{room}"}, "#{msg}"
        else
           robot.messageRoom "##{room}", "#{msg}"
        res.writeHead 204, { 'Content-Length': 0 }
        res.end()

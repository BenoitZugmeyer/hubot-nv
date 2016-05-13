#!/bin/bash

for f in ./config/*; do source $f; done
bin/hubot -a irc --name bot

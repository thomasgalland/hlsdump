var hlsdump = require('./lib/hlsdump.js');

var settings = {
    url: 'http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8',
    duration: 10,
    filename: 'dump.mp4',
    ffmpeg: {
        encode: true,
        exec: 'ffmpeg'
    }
};

var dump = new hlsdump.dump(settings, function (err, result) {
    'use strict';
    if (err !== null) {
        console.error(err);
    } else {
        console.log(result);
    }
});

dump.start();
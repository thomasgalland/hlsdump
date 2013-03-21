var Hlsdump = require('./lib/hlsdump.js');

var settings = {
    url: 'http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8?ticket=toto',
    duration: 20,
    bandwidth: 300000,
    filename: 'dump.ts',
    temporary_folder: 'tmp/',
    retry : 3
};

var dump = new Hlsdump(settings, function (err, result) {
    if (err !== null) {
        console.error('callback error');
        console.error(err);
    } else {
        console.log('callback result');
        console.log(result);
    }
});

dump.on('playlist', function (playlist) {
    console.log("New playlist :");
    console.log(playlist);
});

dump.on('error', function (err) {
    console.error("Error:");
    console.error(err);
});

dump.on('downloaded', function (files) {
    console.log("Downloaded:");
    console.log(files);
});

dump.on('done', function () {
    console.log("Done");
});

dump.start();
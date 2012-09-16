Hlsdump
=======

This is a library to node.js for dumping (c)Apple Http Live Streaming protocol.

What is (c) Apple Http Live Streaming protocol (HLS) ?
------------------------------------------------------

It's a media streaming communication protocol as part of their QuickTime X, iPod, iPhone and Ipad software systems

See wikipedia article http://en.wikipedia.org/wiki/HTTP_Live_Streaming


Why dumping HLS streams with node.js ?
--------------------------------------

HLS is a streaming protocol based on HTTP protcol and HTTP library in node.js is very interesseting to using it in a dumping program, maybe to make a monitoring tool.

How to use it ?
------------

  var hlsdump = require('./lib/hlsdump.js');

  var settings = {
      url: 'http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8', // Streaming Url 
      duration: 10, // Dumping duration, if null no limit
      filename: 'dump.mp4' // Filename of the dumped stream
  };

  var dump = new hlsdump.dump(settings, function (err, result) {
    'use strict';
    if (err !== null) {
        console.error(err);
    }
    if (result !== null) {
        console.log(result);
    }
  });

  dump.start();

How to install it ?
----------------
No NPM package for now

In the future ?
---------------
- Add multi-bitrate option to dumping all streams in a playlist
- Add statistics to use this library in a streaming monitor
- Create a npm package with this library
- Create a bash program using this library

Thanks to:
----------
- Jay Salvat for code reviewing

Licence:
--------



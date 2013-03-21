Hlsdump
=======

This is a library to node.js for dumping (c) Apple Http Live Streaming protocol.

What is (c) Apple Http Live Streaming protocol (HLS) ?
------------------------------------------------------

It's a media streaming communication protocol as part of their QuickTime X, iPod, iPhone and Ipad software systems

See wikipedia article http://en.wikipedia.org/wiki/HTTP_Live_Streaming


Why dumping HLS streams with node.js ?
--------------------------------------

HLS is a streaming protocol based on HTTP protcol and HTTP library in node.js is very interesseting to using it in a dumping program, maybe make a monitoring tool.

How to use it ?
------------

  var settings = {
    url: 'http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8', // streaming Url Vod or live stream
    duration: 20, // Duration of dumping
    bandwidth: 300000, // Bandwidth for multibitrate stream (optional)
    filename: 'dump.ts', // Filename
    temporary_folder: 'tmp/', // Temporary Folder for the chunck ts files
    retry : 3 // if 404 error, number of retry
  };

  var dump = new hlsdump(settings, function (err, result) {
    if (err !== null) {
      console.error('error');
      console.error(err);
    } else {
      console.log('result');
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

How to install it ?
----------------
- With NPM: npm install hlsdump


In the future ?
---------------
- Create a bash program using this library


Thanks to:
----------
- Jay Salvat for code reviewing of the first commit

LICENSE - "MIT License"
-----------------------
Copyright (c) 2013 Thomas Galland


Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:


The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.


THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
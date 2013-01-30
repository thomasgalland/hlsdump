Hlsdump
=======

This is a library to node.js for dumping (c) Apple Http Live Streaming protocol.

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
       duration: 10, // Dumping duration => default 10 seconds
       filename: 'dump.mp4' // Filename of the dumped stream => default dump.mp4
       ffmpeg: {
         encode: true, => Enabled ffmpeg encoding => default false
         exec: 'ffmpeg' => Path to the FFMpeg exec => default ffmpeg
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

How to install it ?
----------------
- Please install before FFMPEG if you whant some statistics and a MP4 file totaly correct.
- With NPM: npm install hlsdump

Statistics :
------------

If ffmepg is installed and set in settings, the return value is like that:

    {
      bitrate: 134.5, // in kb/s
      duration: 10, // in seconds
      audio: {
        codec: 'aac',
        sampling: 22050, // in Hz
        channels: 'mono',
        bitrate: 52 // in kb/s
      },
      video: {
        codec: 'h264',
        colorspace: 'yuv420p',
        width: 192,
        heigth: 144,
        fps: null,
        bitrate: 82.5
      }
    }

In the future ?
---------------
- Add multi-bitrate option to dumping all streams in a playlist
- Create a npm package with this library
- Create a bash program using this library


Thanks to:
----------
- Jay Salvat for code reviewing of the first commit

LICENSE - "MIT License"
-----------------------
Copyright (c) 2010 Matthew Ranney, http://ranney.com/


Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:


The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.


THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
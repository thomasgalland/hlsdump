var http = require("http"),
    url = require("url"),
    fs = require("fs");

var getStringFromUrl = function (path, callback) {
    "use strict";
    var objUrl = url.parse(path, true),
        req = http.request(objUrl, function (res) {

            if (res.statusCode >= 300 && res.statusCode < 400) {
                getStringFromUrl(res.headers.location, callback);
            } else {
                var data = '';
                res.setEncoding('utf8');

                res.on('data', function (chunk) {
                    data += chunk;
                });

                res.on('end', function () {
                    callback(null, data);
                });
            }
        });

    req.on('error', function (err) {
        callback(err, null);
    });

    req.end();
};

var getBinFromUrl = function (path, filename, callback) {
    "use strict";
    var objUrl = url.parse(path, true),
        req = http.request(objUrl, function (res) {
            if (res.statusCode >= 300 && res.statusCode < 400) {
                getStringFromUrl(res.headers.location, callback);
            } else {
                var data = '';
                res.setEncoding('binary');

                res.on('data', function (chunk) {
                    data += chunk;
                });

                res.on('end', function () {
                    fs.appendFile(filename, data, 'binary', function (err) {
                        if (err) {
                            callback(err, null);
                        } else {
                            callback();
                        }
                    });
                });
            }
        });

    req.on('error', function (err) {
        callback(err, null);
    });

    req.end();
};

var isPlaylist = function (data) {
    "use strict";
    return (/#EXTM3U/).test(data);
};

var dump = function (params, callback) {
    "use strict";
    this.url = params.url;
    this.duration = params.duration || 10;
    this.filename = params.filename || "dump.mp4";
    this.playlistUrl = "";
    this.baseUrl = "";
    this.firstPlaylist = "";
    this.lastMedia = 0;
    this.totalDuration = 0;
    this.callback = callback;
    this.ffmpeg = params.ffmpeg || { encode: false, exec: "fmpeg"};
};

dump.prototype.start = function () {
    "use strict";
    var that = this;
    that.deleteDumpFile(function (err) {
        if (err !== null) {
            that.callback(err, null);
        } else {
            getStringFromUrl(that.url, function (err, data) {
                if (err !== null) {
                    that.callback(err, null);
                } else {
                    that.firstPlaylist = data;
                    that.getPlaylist();
                }
            });
        }
    });
};

dump.prototype.deleteFile = function (filename, callback) {
    "use strict";

    fs.exists(filename, function (exists) {
        if (exists === true) {
            fs.unlink(filename, function (err) {
                if (err !== null) {
                    callback(err);
                } else {
                    callback(null);
                }
            });
        } else {
            callback(null);
        }
    });
};

dump.prototype.deleteDumpFile = function (callback) {
    "use strict";
    var that = this;

    that.deleteFile(that.filename, callback);
};

dump.prototype.getPlaylist = function () {
    "use strict";
    var that = this,
        data = that.firstPlaylist,
        lines,
        nb,
        i,
        baseurl;

    if (isPlaylist(data)) {

        lines = data.split("\n");
        nb = 0;

        for (i = 0; i < lines.length; i = i + 1) {
            if (!(/^#/).test(lines[i]) && lines[i].length > 0) {
                baseurl = "";
                if (!(/http/).test(lines[i])) {
                    baseurl = that.getBaseUrl(that.url);
                }
                that.playlistUrl = baseurl + lines[i];
                that.dumpMedias();
                nb = nb + 1;
                // Adaptive bitrate
                break;
            }
        }
        if (nb === 0) {
            this.callback(new Error("no http link in playlist m3u8"), null);
        }
    } else {
        this.callback(new Error("this url isn't a playlist m3u8"), null);
    }
};

dump.prototype.getBaseUrl = function (path) {
    "use strict";
    var urlObj = url.parse(path, true),
        baseUrl = urlObj.protocol + "//" + urlObj.host + urlObj.pathname.replace(/\/[a-zA-Z-_0-9%]*\.m3u8[0-9a-zA-Z-_=&%?]*/, "/");
    return baseUrl;
};

dump.prototype.parsePlaylist = function (data) {
    "use strict";
    var medias = [],
        lines = data.split("\n"),
        i;

    for (i = 0; i < lines.length; i = i + 1) {
        if (!(/^#/).test(lines[i]) && lines[i].length > 0) {
            medias.push({
                url: this.baseUrl + lines[i],
                length : this.getMediaLength(lines[i - 1]),
                id : this.getId(lines[i])
            });
        }
    }
    return medias;
};

dump.prototype.getMediaLength = function (line) {
    "use strict";
    return parseFloat(/\#EXTINF\:([0-9.]*)\,/.exec(line)[1], 10);
};

dump.prototype.getId = function (line) {
    "use strict";
    return parseInt(/[a-zA-Z_\-]*([0-9]*)\.ts/.exec(line)[1], 10);
};

dump.prototype.getMedias = function (baseUrl, medias, nb, callback, bind) {
    "use strict";
    var that = this;

    if (medias[nb].id > bind.lastMedia) {
        getBinFromUrl(medias[nb].url, bind.filename, function (err) {
            that.totalDuration += medias[nb].length;

            bind.lastMedia = medias[nb].id;
            if (err) {
                callback(err, null);
            } else if (that.duration <= that.totalDuration) {
                if (that.ffmpeg.encode === true) {
                    that.encode();
                } else {
                    callback(null, {
                        duration: that.totalDuration
                    });
                }
            } else if (nb === (medias.length - 1)) {
                that.getPlaylist();
            } else {
                nb = nb + 1;
                bind.getMedias(baseUrl, medias, nb, callback, bind);
            }
        });
    } else if (that.duration <= that.totalDuration) {
        if (that.ffmpeg.encode === true) {
            that.encode();
        } else {
            callback(null, {
                duration: that.totalDuration
            });
        }
    } else if (nb === medias.length - 1) {
        that.getPlaylist();
    } else {
        nb = nb + 1;
        bind.getMedias(baseUrl, medias, nb, callback, bind);
    }
};

dump.prototype.dumpMedias = function () {
    "use strict";
    var that = this;

    that.baseUrl = that.getBaseUrl(that.playlistUrl);

    getStringFromUrl(that.playlistUrl, function (err, data) {
        if (err !== null) {
            that.callback(err, null);
        } else {
            that.getMedias(that.baseUrl, that.parsePlaylist(data), 0, that.callback, that);
        }
    });
};

dump.prototype.encode = function () {
    "use strict";
    var that = this,
        exec = require('child_process').exec,
        ffmpeg,
        returnValue;

    fs.createReadStream(that.filename).pipe(fs.createWriteStream(that.filename + '.dump'));

    that.deleteDumpFile(function (err) {
        if (err !== null) {
            that.callback(err, null);
        } else {
            ffmpeg = exec(
                that.ffmpeg.exec + ' -i ' + that.filename + '.dump' + ' -vcodec copy -acodec copy -absf aac_adtstoasc -f mp4 ' + that.filename,
                {
                    encoding: 'utf8',
                    timeout: 300,
                    maxBuffer: 200 * 1024,
                    killSignal: 'SIGKILL',
                    cwd : process.cwd(),
                    env: null
                },
                function (err, stdout, stderr) {
                    if (err !== null) {
                        that.callback(err);
                    } else {
                        that.deleteFile(that.filename + '.dump', function (err) {
                            if (err !== null) {
                                that.callback(err);
                            } else {
                                returnValue = that.parseFFMpegReturn(stderr) || {};
                                returnValue.duration =  Math.round(that.totalDuration * 100) / 100;
                                that.callback(null, returnValue);
                            }
                        });
                    }
                }
            );
        }
    });
};

dump.prototype.parseFFMpegReturn = function (stdout) {
    "use strict";

    var stVideo = /Video: ([a-zA-Z0-9-_ (){}\[\]=:,\/]+)/.exec(stdout)[1],
        stAudio = /Audio: ([a-zA-Z0-9-_ (){}\[\]=:,\/]+)/.exec(stdout)[1],
        returnValue,
        splitAudio,
        splitVideo,
        bitrate = /bitrate= *([0-9.]+)kbits\/s/.exec(stdout)[1];

    splitVideo = stVideo.split(",");
    splitAudio = stAudio.split(",");

    returnValue = {
        bitrate: bitrate,
        audio: {
            codec: /([a-zA-Z0-9-_]+) /.exec(splitAudio[0])[1] || null,
            sampling: parseInt(/([0-9]+) Hz/.exec(splitAudio[1])[1]) || null,
            channels: /([a-z]+)/.exec(splitAudio[2])[1] || null,
            bitrate: parseFloat(/([0-9.]+) kb\/s/.exec(splitAudio[4])[1]) || null
        },
        video: {
            codec: /([a-zA-Z0-9-_]+) /.exec(splitVideo[0])[1] || null,
            colorspace: /([a-zA-Z0-9-_]+)/.exec(splitVideo[1])[1] || null,
            width: parseInt(/([0-9]+)x[0-9]+/.exec(splitVideo[2])[1]) || null,
            heigth: parseInt(/[0-9]+x([0-9]+)/.exec(splitVideo[2])[1]) || null,
            fps: /([0-9.]+) fps/.exec(splitVideo[3]) !== null ? parseInt(/([0-9.]+) fps/.exec(splitVideo[3])[1]) : null,
            bitrate: Math.round((parseFloat(bitrate) - parseFloat(/([0-9.]+) kb\/s/.exec(splitAudio[4])[1])) * 100) / 100 || null
        }
    };

    return returnValue;
};

var hlsdump = {
    dump: dump
};

module.exports = hlsdump;
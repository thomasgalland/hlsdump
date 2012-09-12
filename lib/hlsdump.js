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
    this.duration = params.duration;
    this.filename = params.filename;
    this.playlistUrl = "";
    this.baseUrl = "";
    this.firstPlaylist = "";
    this.lastMedia = 0;
    this.totalDuration = 0;
    this.callback = callback;
};

dump.prototype.start = function () {
    "use strict";
    var that = this;
    that.deleteFile(function (err) {
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

dump.prototype.deleteFile = function (callback) {
    "use strict";
    var that = this;

    fs.exists(that.filename, function (exists) {
        if (exists === true) {
            fs.unlink(that.filename, function (err) {
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
            if (!(/^#.*$/).test(lines[i]) && lines[i].length > 0) {
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
        baseUrl = urlObj.protocol + "//" + urlObj.host + urlObj.pathname.replace(/\/[a-zA-Z-_0-9%]*\.m3u8.*/, "/");
    return baseUrl;
};

dump.prototype.parsePlaylist = function (data) {
    "use strict";
    var medias = [],
        lines = data.split("\n"),
        i;

    for (i = 0; i < lines.length; i = i + 1) {
        if (!(/^#.*$/).test(lines[i]) && lines[i].length > 0) {
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
    return parseInt(/\#EXTINF\:([0-9]*)\,/.exec(line)[1], 10);
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
                callback(null, {
                    duration: that.totalDuration
                });
            } else if (nb === (medias.length - 1)) {
                that.getPlaylist();
            } else {
                nb = nb + 1;
                bind.getMedias(baseUrl, medias, nb, callback, bind);
            }
        });
    } else if (that.duration <= that.totalDuration) {
        callback(null, {
            duration: that.totalDuration
        });
    } else if (nb === medias.length - 1) {
        that.getPlaylist();
        callback(null);
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

var hlsdump = {
    dump: dump
};

module.exports = hlsdump;
var http = require("http"),
    url = require("url"),
    fs = require("fs");

var PlaylistInfItem = function (baseurl, parameters, path) {

    PlaylistInfItem.prototype._initialize = function (baseurl, parameters, path) {
        var self = this,
            splittedParameters,
            splittedValue,
            i;

        self.type = "inf";

        if (/^http\:\/\//.test(path) === false) {
            self.url = baseurl + path;
        } else {
            self.url = path;
        }

        splittedParameters = parameters.split(/, {0,1}/);

        self.duration = parseFloat(splittedParameters[0], 10);
        self.description = splittedParameters[1];

    };

    PlaylistInfItem.prototype.download = function (filename, callback) {
        var self = this,
            objUrl = url.parse(self.url, true),
            req = http.request(objUrl, function (res) {
                if (res.statusCode >= 300 && res.statusCode < 400) {
                    self.download(filename, callback);
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
                                callback(null);
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

    PlaylistInfItem.prototype.getId = function () {
        var self = this,
            path = require('path'),
            urls = url.parse(self.url),
            matches;

        matches = /([0-9]+)$/.exec(path.basename(urls.pathname, path.extname(urls.pathname)));

        if (typeof matches[1] === 'undefined') {
            throw new Error("Can't get the id of the par of video " + self.url);
        }


        return matches[1];
    };

    this._initialize(baseurl, parameters, path);
};

module.exports = PlaylistInfItem;
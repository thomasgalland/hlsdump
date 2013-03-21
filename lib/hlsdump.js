var http = require("http"),
    url = require("url"),
    fs = require("fs"),
    util = require("util"),
    EventEmitter = require('events').EventEmitter,
    Playlist = require("./Playlist.js");

var Hlsdump = function (parameters, callback) {
    Hlsdump.prototype._initialized = true;

    Hlsdump.prototype._initialize = function (parameters, callback) {
        var self = this;

        self.url = parameters.url;
        self.duration = parameters.duration || null;
        self.filename = parameters.filename || "dump.ts";
        self.bandwidth = parameters.bandwidth || null;
        self.temporary_folder = parameters.temporary_folder || "./";
        self.retry = parameters.retry || 0;
        self.callback = callback || null;
        self.playlists = [];
        self.downloaded_duration = 0;
        self.downloaded_files = [];

        self.on('playlist', function (playlist) {
            self._parsePlaylist(playlist);
        });

        self.on('downloaded', function (files) {
            self._concatTsFiles(files);
        });

        self.on('error', function (err) {
            if (self.callback !== null) {
                return callback(err, null);
            }
        });

        self.on('done', function () {
            if (self.callback !== null) {
                return callback(null, {
                    duration: self.downloaded_duration,
                    files: self.downloaded_files
                });
            }
        });

        return self;
    };

    Hlsdump.prototype._concatTsFiles = function (files) {
        var self = this,
            exec = require('child_process').exec,
            i,
            params = '';

        for (i in files) {
            if (files.hasOwnProperty(i)) {
                params = params + files[i] + ' ';
            }
        }

        exec('cat ' + params + '> ' + self.filename,
            {
                encoding: 'utf8',
                maxBuffer: 200 * 1024,
                killSignal: 'SIGKILL',
                cwd: process.cwd(),
                env: null
            },
            function (err, stdout, stderr) {
                if (err !== null) {
                    self.emit('error', err);
                } else {
                    self.emit('done');
                }
            });
    };

    Hlsdump.prototype._deleteFile = function (filename, callback) {
        fs.exists(filename, function (exists) {
            if (exists === true) {
                fs.unlink(filename, function (err) {
                    if (err !== null) {
                        return callback(err);
                    } else {
                        return callback(null);
                    }
                });
            } else {
                return callback(null);
            }
        });
    };

    Hlsdump.prototype._parsePlaylist = function (playlist) {
        var self = this,
            i,
            j,
            targetDuration = 2,
            diff = null,
            newDiff = null,
            playlistItem,
            streamPlaylist,
            parent;

        self.playlists.push(playlist);
        playlist.id = self.playlists.length - 1;

        switch (playlist.type) {
        case "streams":
            for (i in playlist.items) {
                if (playlist.items.hasOwnProperty(i)) {
                    if (self.bandwidth === null) {
                        playlistItem = playlist.items[i];
                        break;
                    } else {
                        newDiff =  self.bandwidth - playlist.items[i].bandwidth;
                        if (newDiff >= 0 && (diff === null ||  diff > newDiff)) {
                            diff = newDiff;
                            playlistItem = playlist.items[i];
                        }
                    }
                }
            }
            if (typeof playlistItem !== 'undefined') {
                switch (playlistItem.type) {
                case "stream":
                    streamPlaylist = new Playlist(playlistItem.playlist, self.retry);

                    streamPlaylist.get(function (err, newPlaylist, item) {
                        if (err !== null) {
                            self.emit('error', new Error("Can't getting playlist " + err));
                        } else {
                            newPlaylist.parent = playlist.id;
                            newPlaylist.bandwidth = item.bandwidth;
                            self.emit("playlist", newPlaylist);
                        }
                    }, playlistItem);
                    break;
                }
            } else {
                self.emit('error', new Error('No playlist for this bandwidth (' + self.bandwidth + ')'));
            }

            break;
        case "media_sequence":
            self._downloadMediaSequence(playlist, function (err) {
                if (err !== null) {
                    self.emit('error', new Error("Can't download inf file " + err));
                } else {
                    if (self.duration === null || self.duration > self.downloaded_duration) {
                        
                        for (j in playlist.items) {
                            if (playlist.items.hasOwnProperty(j)) {
                                if (playlist.items[j].type === 'target_duration') {
                                    targetDuration = playlist.items[j].duration; 
                                }
                            }
                        }

                        setTimeout(function (playlist, self) {
                            playlist.get(function (err, newPlaylist, item) {
                                if (err !== null) {
                                    self.emit('error', new Error("Can't getting playlist " + err));
                                } else {
                                    newPlaylist.parent = playlist.id;
                                    self.emit("playlist", newPlaylist);
                                }
                            });
                        }, targetDuration * 1000, playlist, self);
                    } else {
                        self.emit('downloaded', self.downloaded_files);
                    }
                }
            });
            break;
        }
    };

    Hlsdump.prototype._downloadMediaSequence = function (playlist, callback, i) {
        var self = this,
            filename;

        if (typeof i === "undefined") {
            i = 0;
        }

        if (playlist.items[i].type === 'inf') {
            filename = self.temporary_folder  + playlist.bandwidth + "_" + playlist.items[i].getId() + ".ts";
            if (self.downloaded_files.indexOf(filename) === -1) {
                playlist.items[i].download(filename, function (err) {
                    if (err !== null) {
                        return callback(err);
                    } else {
                        self.downloaded_duration = (self.downloaded_duration || 0) + playlist.items[i].duration;
                        self.downloaded_files.push(filename);

                        if ((i + 1) < playlist.items.length && (self.duration === null || self.downloaded_duration < self.duration)) {
                            self._downloadMediaSequence(playlist, callback, i + 1);
                        } else {
                            return callback(null);
                        }
                    }
                });
            } else {
                if ((i + 1) < playlist.items.length && (self.duration === null || self.downloaded_duration < self.duration)) {
                    self._downloadMediaSequence(playlist, callback, i + 1);
                } else {
                    return callback(null);
                }
            }
        } else {
            if ((i + 1) < playlist.items.length && (self.duration === null || self.downloaded_duration < self.duration)) {
                self._downloadMediaSequence(playlist, callback, i + 1);
            } else {
                return callback(null);
            }
        }
    };

    Hlsdump.prototype.start = function () {
        var self = this,
            playlist;

        self._deleteFile(self.filename, function (err) {
            if (err !== null) {
                self.emit('error', new Error("Can't delete dumped file " + err));
            } else {
                playlist = new Playlist(self.url, self.retry);
                playlist.get(function (err, playlist) {
                    if (err !== null) {
                        self.emit('error', new Error("Can't getting playlist " + err));
                    } else {
                        self.playlists.push(playlist);
                        playlist.id = self.playlists.length - 1;
                        self.emit("playlist", playlist);
                    }
                });
            }
        });
    };

    return this._initialize(parameters, callback);
};

util.inherits(Hlsdump, EventEmitter);

module.exports = Hlsdump;
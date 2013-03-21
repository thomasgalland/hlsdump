var PlaylistStreamItem = function (baseurl, parameters, url) {

    PlaylistStreamItem.prototype._initialize = function (baseurl, parameters, url) {
        var self = this,
            splittedParameters,
            splittedValue,
            i;

        self.type = "stream";

        if (/^http\:\/\//.test(url) === false) {
            self.playlist = baseurl + url;
        } else {
            self.playlist = url;
        }

        splittedParameters = parameters.split(/, {0,1}/);

        for (i = 0; i < splittedParameters.length; i = i + 1) {
            splittedValue = splittedParameters[i].split("=");

            switch (splittedValue[0]) {
            case "BANDWIDTH":
                self.bandwidth = parseInt(splittedValue[1], 10);
                break;
            case "PROGRAM-ID":
                self.program_id = parseInt(splittedValue[1], 10);
                break;
            }
        }
    };

    this._initialize(baseurl, parameters, url);
};

module.exports = PlaylistStreamItem;
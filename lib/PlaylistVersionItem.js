var PlaylistVersionItem = function (parameters) {

    PlaylistVersionItem.prototype._initialize = function (parameter) {
        var self = this,
            splittedParameters;

        self.type = "version";
        self.version = parameter;
    };

    this._initialize(parameters);
};

module.exports = PlaylistVersionItem;
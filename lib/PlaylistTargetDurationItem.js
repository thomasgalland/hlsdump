var PlaylistTargetDurationItem = function (parameters) {

    PlaylistTargetDurationItem.prototype._initialize = function (parameter) {
        var self = this,
            splittedParameters;

        self.type = "target_duration";
        self.duration = parseFloat(parameter, 10);
    };

    this._initialize(parameters);
};

module.exports = PlaylistTargetDurationItem;
var Http = require("http"),
	Url = require("url"),
	Fs = require("fs");

getStringFromUrl = function(url, callback){
	var objUrl = Url.parse(url, true);
	var req = Http.request(objUrl, function(res){

		if(res.statusCode >= 300 && res.statusCode <400){
				getStringFromUrl(res.headers.location, callback);
		}else{
	        var data = '';
	        res.setEncoding('utf8');

	        res.on('data', function (chunk) {
	            data += chunk;
	        });

	        res.on('end', function() {
	           callback(null, data);
	        });
	    }
    });

    req.on('error', function(err) {
        callback(err, null);
    });

    req.end();
};

getBinFromUrl = function(url, filename, callback){
	var objUrl = Url.parse(url, true);
	var req = Http.request(objUrl, function(res){

		if(res.statusCode >= 300 && res.statusCode <400){
				getStringFromUrl(res.headers.location, callback);
		}else{
	        var data = '';
	        res.setEncoding('binary');

	        res.on('data', function (chunk) {
	            data += chunk;
	        });

	        res.on('end', function() {
	        	Fs.appendFile(filename, data, 'binary', function(err){
		            if (err){
		            	callback(err, null);
		            }else{
		            	callback();
		            }
		        })
	        });
	    }
    });

    req.on('error', function(err) {
        callback(err, null);
    });

    req.end();
};


isPlaylist = function(data){
	return /#EXTM3U/.test(data);
}

dump = function(params, callback){
	this.url = params.url;
	this.duration = params.duration;
	this.filename = params.filename;
	this.playlistUrl = "";
	this.baseUrl = "";
	this.firstPlaylist="";
	this.lastMedia=0;
	this.totalDuration=0;
	this.callback = callback;
};

dump.prototype.start = function(){
	var $$ = this;
	$$.deleteFile(function(err){
		if(err != null){
			$$.callback(err, null);
		} else{
			getStringFromUrl($$.url, function(err, data){
				if(err != null){
					$$.callback(err, null);
				}else{
					$$.firstPlaylist = data;
					$$.getPlaylist();
				}
			})
		}
	});
};

dump.prototype.deleteFile = function(callback){
	var $$ = this;

	Fs.exists($$.filename, function(exists){
		if(exists == true){
			Fs.unlink($$.filename, function (err) {
			  if (err != null){
			  	callback(err);
			  }else{
				callback(null);  	
			  }
			});
		}else{
			callback(null);
		}
	});
}

dump.prototype.getPlaylist = function(){
	var $$ = this;
	var data = $$.firstPlaylist;
	if(isPlaylist(data)){
		var lines = data.split("\n");

		var nb = 0;

		for(var i=0; i<lines.length; i++){
			if( ! /^#.*$/.test(lines[i]) && lines[i].length > 0){
				var baseurl = "";
				if( ! /http/.test(lines[i]) ){
					baseurl = $$.getBaseUrl($$.url);
				}
				$$.playlistUrl = baseurl+lines[i];
				$$.dumpMedias();
				nb++;
				// Adaptive bitrate
				break;
			}
		}
		if(nb == 0){
			this.callback(new Error("no http link in playlist m3u8"), null);
		}
	}else{
		this.callback(new Error("this url isn't a playlist m3u8"), null);
	}
};

dump.prototype.getBaseUrl = function(url){
	urlObj = Url.parse(url, true);
	var baseUrl = urlObj.protocol+"//"+urlObj.host+urlObj.pathname.replace(/\/[a-zA-Z-_0-9%]*\.m3u8.*/, "/");
	return baseUrl;
};

dump.prototype.parsePlaylist = function(data){
	var medias = new Array();
	var lines = data.split("\n");

	for(var i=0; i<lines.length; i++){
		if( ! /^#.*$/.test(lines[i]) && lines[i].length > 0){
			medias.push({
				url: this.baseUrl + lines[i],
				length : this.getMediaLength(lines[i-1]),
				id : this.getId(lines[i])
			});
		}
	}
	return medias;
};

dump.prototype.getMediaLength = function (line){
	return parseInt(/\#EXTINF\:([0-9]*)\,/.exec(line)[1]);
}

dump.prototype.getId = function (line){
	return parseInt(/[a-zA-Z_-]*([0-9]*)\.ts/.exec(line)[1]);
}

dump.prototype.getMedias = function(baseUrl, medias, nb, callback, bind){
	if(medias[nb].id > bind.lastMedia){
		getBinFromUrl(medias[nb].url, bind.filename, function(err){
			$$.totalDuration += medias[nb].length;

			bind.lastMedia = medias[nb].id;
			if(err){
				callback(err, null)
			} else if($$.duration <= $$.totalDuration){
				callback(null, {
					duration: $$.totalDuration
				});
			} else if(nb == (medias.length - 1) ){
				$$.getPlaylist();
			}else{
				nb++;
				bind.getMedias(baseUrl, medias, nb, callback, bind);
			}
		});
	}else if($$.duration <= $$.totalDuration){
		callback(null, {
			duration: $$.totalDuration
		});
	}else if(nb == medias.length - 1 ){
		$$.getPlaylist();
		callback(null);
	}else{
		nb++;
		bind.getMedias(baseUrl, medias, nb, callback, bind);
	}
};

dump.prototype.dumpMedias = function(){
	$$ = this;

	$$.baseUrl = $$.getBaseUrl($$.playlistUrl);

	getStringFromUrl($$.playlistUrl, function(err, data){
		if(err != null){
			$$.callback(err, null);
		}else{
			$$.getMedias(this.baseUrl, $$.parsePlaylist(data), 0, $$.callback, $$);
		}
	})
};

hlsdump = {
	dump: dump
};

module.exports = hlsdump;
var hlsdump = require(__dirname + "/lib/hlsdump.js");

var dump = new hlsdump.dump(
	{
		url: "http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8",
		duration: 120,
		filename: "dump.mp4"
	},
	function(err, result){
		if(err != null){
			console.error(err);
		}
		if(result != null){
			console.log(result);
		}
	}
);

dump.start();
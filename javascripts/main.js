$(function() {
	"use strict";
	var $contaienr = $("#demo"),
		$video =  $contaienr.children("video"),
		playing = false,
		played = false,
		duration,
		$playpause = $("#playpause"),
		$currentTime = $("#currenttime"),
		$seek = $("#seek"),
		currentTime;


	var yt5 = loadYT5($video, "2gLq4Ze0Jq4", 0, false, false);

	$video.on("durationchange", function(){
		duration = yt5.video.duration;
		$("#duration").html(yt5.secondsToTime(duration));
		$seek.attr("max",Math.floor(duration));
	})
	.on("timeupdate", function(){
		currentTime = yt5.video.currentTime;
		$currentTime.html(yt5.secondsToTime(currentTime));
		$seek.val(Math.floor(currentTime));
	})
	.on("play", function(){
		playing = true;
		$playpause.addClass("playing");
		if(!played) {
			// README only needed to use our custom overlay on top of the YT-iframe 
			// which needs to be hidden for the initial play on mobile devices
			played = true;
			$contaienr.addClass("played");
		}
	})
	.on("pause", function(){
		playing = false;
		$playpause.removeClass("playing");
	});

	$playpause
	.add($contaienr).on("click",function() {
		if(playing) {
			yt5.video.pause();
		} else {
			yt5.video.play();
		}
	});
	$seek.on("change input",function() {
		yt5.video.currentTime = $seek.val();
	});
});

$(function() {
	"use strict";
	var $container = $("#demo"),
		$video =  $container.children("video"),
		playing = false,
		played = false,
		$playpause = $("#playpause"),
		$currentTime = $("#currenttime"),
		$seek = $("#seek"),
		$volume = $("#volume"),
		$volumeLabel = $("label[for=volume]"),
		currentTime,
		yt5;



	$video.on("durationchange", function(){
		var duration = yt5.video.duration;
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
			// README only needed if a custom overlay on top of the YT-iframe is used
			// this needs to be hidden for the initial play on mobile devices
			played = true;
			$container.addClass("played");
		}
	})
	.on("pause", function(){
		playing = false;
		$playpause.removeClass("playing");
	})
	.on("loadedmetadata", function(){
		var video = yt5.video;
		$playpause
		.add($container).on("click",function() {
			if(playing) {
				video.pause();
			} else {
				video.play();
			}
		});
		$seek.on("change input",function() {
			video.currentTime = $seek.val();
		});
		$volume.on("change input",function() {
			video.volume = $volume.val();
			$volumeLabel.attr("rel",Math.round($(this).val()*100));
		})
		.val(video.volume)
		.trigger("change");
	});

	yt5 = loadYT5($video, "2gLq4Ze0Jq4", 0, false, false);
});

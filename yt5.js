var loadYT5 = function($video, ytID, startSeconds, startVolume, autoPlay, loop) {
	"use strict";
	// README $video is the jquery container where the YT iframe is placed in. It will act just like a video-element after this code initialized

	var ytIframePlayer,
		yt5,
		floor = Math.floor,
		ytUri = 'https://www.youtube.com/iframe_api',
		ua = window.navigator.userAgent.toLowerCase(),
		isIOS = ua.indexOf('ipad') != -1 || ua.indexOf('iphone') != -1,
		video = $video[0];

	startVolume = startVolume || 0.8;
	autoPlay = autoPlay || false;
	loop = loop || false;

	if(window["yt5"]) {
		yt5 = window["yt5"];
		ytIframePlayer = yt5["YT"];
		video = yt5["video"];
		video._currentTimeAccurate = null;
		video["volume"] = startVolume;
		return;
	}


	if(!startSeconds || isIOS) {
		startSeconds=0;
	} else {
		startSeconds = floor(startSeconds); // in seconds
	}

	yt5 = {
		"YT":null,
		"video": video,

		"secondsToTime" : function(seconds,forceHours,showMiliSeconds,returnArray) {
			var mSeconds = "",
				minutes,
				hours,
				floor = Math.floor;
			if(showMiliSeconds) {
				mSeconds = floor(seconds % 1 *1000);
				mSeconds = "." + ('00' + mSeconds).slice(-3);
			}
			seconds = floor(seconds);
			minutes = floor(seconds / 60);
			if (minutes >= 60) {
				hours = floor(minutes / 60);
				minutes = minutes % 60;
			} else {
				hours = 0;
			}
			seconds = ('0' + floor(seconds % 60)).slice(-2);
			minutes = (minutes >= 10 || (!forceHours && !hours)) ? minutes : "0" + minutes;
			hours = ((hours > 0 || forceHours) ? hours + ":" :'');
			if(returnArray) {
				return [hours + minutes + ":" + seconds, mSeconds];
			}
			return hours + minutes + ":" + seconds + mSeconds;
		}
	};
	window["yt5"] = yt5;


	// 2. This code loads the IFrame Player API code asynchronously.
	var tag = document.createElement('script');
	tag.src = ytUri;
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


	// 3. This function creates an <iframe> (and YouTube player)
	//    after the API code downloads.
	window["onYouTubeIframeAPIReady"] = function() {

		$('<iframe id="ytplayer" width="100%" height="100%" src="//www.youtube.com/embed/'+ytID+'?controls=0&html5=1&wmode=opaque&rel=0&enablejsapi=1&fs=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&loop='+(loop?'0&playlist='+ytID:0)+(startSeconds?'&start='+startSeconds:'')+'&autoplay='+(autoPlay?'1':'0')+'&origin='+location.protocol+'//'+location.host+'" frameborder="0">')
		.insertBefore($video.hide());


		function checkDurationChange() {
			if(video.duration > 0) {
				$video.trigger("loadedmetadata");
				$video.trigger("durationchange");
			} else {
				window.setTimeout(checkDurationChange, 250);
			}
		}
		function onPlayerReady() {//(event) {

			// https://developers.google.com/youtube/iframe_api_reference
			video = {
				// vars
				"readyState": 3,
				"videoWidth" : 16, // no way of retrieving that - assume 16:9
				"videoHeight" : 9, // no way of retrieving that - assume 16:9
				"error":{}, // placeholder
				"type":'video/yt',
				_currentTimeAccurate:null,
				// functions
				"play": function() {
					ytIframePlayer["playVideo"]();
				},
				"pause": function() {
					ytIframePlayer["pauseVideo"]();
				},
				"load": function() {
					// do nothing
				},
				"canPlayType": function(type) {
					return (type=="yt");
				},
				// get only
				get "duration"(){
					return ytIframePlayer["getDuration"]();
				},
				// get & set
				get "currentTime"(){
					if(this._currentTimeAccurate) { // grabbed from YT's own postmessages
						return this._currentTimeAccurate;
					} else { // fallback
						return ytIframePlayer["getCurrentTime"]();
					}
				},
				set "currentTime"(seconds){
					ytIframePlayer["seekTo"](floor(seconds),true);
				},
				get "src"() {
					// return ytIframePlayer["getVideoUrl"]();
					return ytIframePlayer["getVideoData"]()["video_id"];
				},
				set "src"(ytId) {
					ytIframePlayer["loadVideoById"]( ytId );
					checkDurationChange();
				},
				get "muted"() {
					return ytIframePlayer["isMuted"]();
				},
				set "muted"(status) {
					if(status) {
						ytIframePlayer["mute"]();
					} else {
						ytIframePlayer["unMute"]();
					}
				},
				get "volume"() {
					return ytIframePlayer["getVolume"]()/100;
				},
				set "volume"(volume) {
					ytIframePlayer["setVolume"](volume*100);
				}
			};
			yt5["video"] = video;

			video["volume"] = startVolume;


			// README YouTube's getCurrenttime will only return seconds:number, not fractions of that. In order to not mess with our interactive overlay too much, we have to check if it actually changed before triggering a timeupdate event
			window.addEventListener("message", function(event) {
				var data = event.data;
				if(!data) {
					return;
				}
				if("string" === typeof data) {
					try {
						data = JSON.parse(data);
					} catch (e) {
						return false;
					}
				}
				if(data["event"] && data["event"]=="infoDelivery" && data["info"] && data["info"]["currentTime"]) {
					// console.log(video._currentTimeAccurate);
					if(video._currentTimeAccurate != data["info"]["currentTime"]) {
						video._currentTimeAccurate = data["info"]["currentTime"];
						// console.info(yt5._currentTime);

						$video.trigger("timeupdate");
					}
				}
			}, false);

			checkDurationChange();
			$video.trigger("canplay");
		}
		function onPlayerPlaybackQualityChange(event) {
			// cnsl.info("qualichange",event.data);
		}


		//    The API calls this function when the player's state changes.
		//    The function indicates that when playing a video (state=1),
		//    the player should play for six seconds and then stop.
		function onPlayerStateChange(event) {
			// cnsl.info("onPlayerStateChange",event.data,YTIframe['PlayerState']);
			switch(event.data) {
			case 0://YTIframe['PlayerState']['ENDED']: 
				$video.trigger("ended");
				if(!loop) {
					$video.trigger("pause"); // causes ticker to stop
				}
				break;
			case 1://YTIframe['PlayerState']['PLAYING']: 
				// console.log(video.currentTime);
				$video.trigger("play");
				break;
			case 2://YTIframe['PlayerState']['PAUSED']: 
				$video.trigger("pause");
				break;
			// case 3://YTIframe['PlayerState']['BUFFERING']: 
			// 	break;
			// case 5://YTIframe["PlayerState"]["CUED"]:
			// 	updateQualitySelect();
			// 	break;
			}
		}
		function onPlayerError(event) {
			var err;
			$video.trigger("error",event.data);

			switch(event.data) {
			case 2: 
				err = 'INVALID_PARAM';
				break;
			case 5: 
				err = 'HTML5_COMPAT_OR_ERROR';
				break;
			case 100: 
				err = 'VIDEO_404';
				break;
			case 101: 
			case 150: 
				err = 'VIDEO_402';
				break;
			default:
				err = 'UNKNOWN';
			}
			console.error(err,event);
		}


		ytIframePlayer = new window["YT"]['Player']('ytplayer', {
			'events': {
				'onReady': onPlayerReady,
				'onPlaybackQualityChange': onPlayerPlaybackQualityChange,
				'onStateChange': onPlayerStateChange,
				'onError': onPlayerError
			}
		});
		yt5["YT"] = ytIframePlayer;

	};

	// Load YT synched
	// $.ajax({
	// 	url:ytUri,
	// 	dataType:"script",
	// 	cache:true
	// });
	return yt5;
};
window["loadYT5"] = loadYT5;
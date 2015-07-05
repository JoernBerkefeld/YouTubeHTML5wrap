# YouTubeHTML5wrap
makes youtube's iframe api compatible to a standard HTML5-video node

look at the demo.html & demo.js to see how it's used. Basically it will trigger standard HTML5 video events like play, pause, ended, seek on the container you specify. The only difference to an actual video element is that the functions (play(), currentTime and so on) will be available through a special object supplied by the wrapper instead of being directly accessible thru the container.

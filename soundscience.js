var blueSkyBuffer = null;
var context = new webkitAudioContext();
var average;
var average2;

function onError(err) {
  console.log(err);
}

function getAverageVolume(array) {
    var values = 0;
    var average;

    var length = array.length;

    // get all the frequency amplitudes
    for (var i = 0; i < length; i++) {
        values += array[i];
    }

    average = values / length;
    return average;
}

function playSound(buffer) {
  var source = context.createBufferSource(); // creates a sound source
  source.buffer = buffer;                    // tell the source which sound to play
  source.connect(context.destination);       // connect the source to the context's destination (the speakers)
  source.noteOn(0);                          // play the source now
}


function loadBlueSky() {
  var request = new XMLHttpRequest();
  request.open('GET', 'bluesky.mp3', true);
  request.responseType = 'arraybuffer';
  // Decode asynchronously
  request.onload = function() {
    context.decodeAudioData(request.response, function(audioBuffer) {
        // Create/set audio buffer for each chunk
        var ctx = document.getElementById('bluesky').getContext('2d');
        var source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.noteOn(0);
        // setup a analyzer
        var analyser = context.createAnalyser();
        analyser.smoothingTimeConstant = 0.3;
        analyser.fftSize = 1024;
        source.connect(analyser);
        
        var analyser2 = context.createAnalyser();
        analyser2.smoothingTimeConstant = 0.0;
        analyser2.fftSize = 1024;

        splitter = context.createChannelSplitter();
        source.connect(splitter);
        splitter.connect(analyser,0,0);
        splitter.connect(analyser2,1,0);
        var audioProcessor = context.createScriptProcessor(4096);
        requestAnimationFrame(function draw() {
          // get the average, bincount is fftsize / 2
          var array =  new Uint8Array(analyser.frequencyBinCount);
          var array2 =  new Uint8Array(analyser2.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          average = getAverageVolume(array)
          analyser2.getByteFrequencyData(array2);
          average2 = getAverageVolume(array2);
          var gradient = ctx.createLinearGradient(0,0,0,300);
          gradient.addColorStop(1,'#000000');
          gradient.addColorStop(0.75,'#ff0000');
          gradient.addColorStop(0.25,'#ffff00');
          gradient.addColorStop(0,'#ffffff');
 
          // clear the current state
          ctx.clearRect(0, 0, 1000, 325);
   
   
          // create the meters
          for ( var i = 0; i < (array.length); i++ ){
            var value = array[i];

            // set the fill style
            ctx.fillStyle=gradient;
            ctx.fillRect(i*5,325-value,3,325);
            ctx.beginPath();
            ctx.arc(50, 50 , value/10, 0 , 2 * Math.PI, false);
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#003300';
            ctx.stroke();
          }
          requestAnimationFrame(draw);
        });
        audioProcessor.onaudioprocess = function (audioData) {
          
          console.log('bhalO');
        };
        analyser.connect(audioProcessor);
        source.connect(context.destination);  
        audioProcessor.connect(context.destination);      
    }, onError);
  }
  request.send();
}
loadBlueSky();
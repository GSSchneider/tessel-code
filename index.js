// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

/*********************************************
This servo module demo turns the servo around
1/10 of its full rotation every 500ms, then
resets it after 10 turns, reading out position
to the console at each movement.
*********************************************/

var tessel = require('tessel');
var servolib = require('servo-pca9685');
var av = require('tessel-av');
var servo = servolib.use(tessel.port['A']);
var readline = require('readline');
const speaker = new av.Speaker();

var servo1 = 1; // We have a servo plugged in at position 1
var talking = false;

servo.on('ready', function () {
  var position = 0;  //  Target position of the servo between 0 (min) and 1 (max).

  //  Set the minimum and maximum duty cycle for servo 1.
  //  If the servo doesn't move to its full extent or stalls out
  //  and gets hot, try tuning these values (0.05 and 0.12).
  //  Moving them towards each other = less movement range
  //  Moving them apart = more range, more likely to stall and burn out
  servo.configure(servo1, 0.05, 0.12, function () {
    setInterval(function () {
//      console.log('Position (in range 0-1):', position);
      //  Set servo #1 to position pos.
      if (talking) {
        servo.move(servo1, position);
      }

      // Increment by 10% (~18 deg for a normal servo)
      position += 0.25;
      if (position > 1) {
        position = 0; // Reset servo position
      }
    }, 200); // Every 500 milliseconds
  });

  function setLed(n, on) {
    if (on) {
      tessel.led[n].on();
    } else {
      tessel.led[n].off();
    }
  }


  const mic = new av.Microphone();
  mic.listen();
//  mic.monitor();

  var roll = [];
  var ROLL_SIZE=10;
  for (var i = 0; i < ROLL_SIZE; i++) {
    roll[i] = 0;
  }
  var roller = 0;
  var threshold = 50;
  var speakAgain = true;
  speaker.on('ended', function() {
    speakAgain = true;
  });
  const LEAN_POWER = 7; // bigger is leaner
  const LEAN = Math.pow(2, LEAN_POWER);
  mic.on("data", buffer => {
    var avg = 0;
    for (var i = 0; i < buffer.length; i += LEAN) {
      avg += Math.abs(buffer[i]-128);
    }
    avg /= buffer.length/LEAN;
    roll[roller++] = avg;
    roller %= ROLL_SIZE;
    var avg2 = 0;
    for (var j = 0; j < ROLL_SIZE; j++) {
      avg2 += roll[j];
    }
    avg2 /= ROLL_SIZE;
    var shouldTalk = avg2 < 65 && speakAgain;
    if (shouldTalk) {
      if (threshold > 0) {
        threshold--;
      }
    } else if (threshold < 5) {
      threshold = 5;
    }
/*    setLed(0, avg2 < 65);
    setLed(1, avg2 < 70);
    setLed(2, avg2 < 75);
    setLed(3, avg2 < 80);*/
    setLed(0, threshold < 10);
    setLed(1, threshold < 20);
    setLed(2, threshold < 40);
    setLed(3, shouldTalk);
    if (shouldTalk && threshold === 0) {
      const PHRASES = [
        "destroy them my robots",
        "you suck",
        "get a life",
        "goo goo ga ga",
        "i have the urge to peel",
        "you're going to speak again aren't you",
        "love your enemies, it makes them angry",
        "kneel before me pee on",
        "just give up",
        "guess the number between 1 and 1 hundred",
        "you wanted the best you got the best",
        "i can has cheeseburger",
        "what did the fox say?"
      ];
      var phrase = Math.floor(Math.random()*PHRASES.length);
      speakAgain = false;
      speaker.say(PHRASES[phrase]);
      threshold = 50;
    }
//    talking = shouldTalk;
  });

});

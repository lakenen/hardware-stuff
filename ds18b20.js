/**
 * NOTE: this does not run on the built-in firmware. Steps to make it work:
 *  - get and install the arduino IDE from http://arduino.cc/en/Main/Software#toc1
 *  - rm -r /Applications/Arduino.app/Contents/Resources/Java/libraries/Firmata
 *  - git clone git@github.com:firmata/arduino.git --branch configurable --single-branch /Applications/Arduino.app/Contents/Resources/Java/libraries/Firmata
 *  - flash the board with ConfigurableFirmata
 *    - File > Examples > Firmata > ConfigurableFirmata
 *    - Click 'Upload'
 *
 * https://github.com/rwaldron/johnny-five/issues/285
 */


var five = require('johnny-five'), board

// the pin the DS18B20 is connected on
var pin = 2;
var board = new five.Board();

board.on('ready', function () {

  // var led = new five.Led(8)
  var led = new five.Led.RGB([9, 10, 11])

  board.firmata = board.io;
  board.firmata.sendOneWireConfig(pin, true);
  board.firmata.sendOneWireSearch(pin, function(error, devices) {
    if(error) {
      console.error(error);
      return;
    }

    // only interested in the first device
    var device = devices[0];

    var readTemperature = function() {
      // led.on();

      // start transmission
      board.firmata.sendOneWireReset(pin);

      // a 1-wire select is done by ConfigurableFirmata
      board.firmata.sendOneWireWrite(pin, device, 0x44);

      // the delay gives the sensor time to do the calculation
      board.firmata.sendOneWireDelay(pin, 1000);

      // start transmission
      board.firmata.sendOneWireReset(pin);

      // tell the sensor we want the result and read it from the scratchpad
      board.firmata.sendOneWireWriteAndRead(pin, device, 0xBE, 9, function(error, data) {
        if(error) {
          console.error(error);
          return;
        }
        var raw = (data[1] << 8) | data[0];
        var celsius = raw / 16.0;
        var fahrenheit = celsius * 1.8 + 32.0;

        console.info('celsius', celsius);
        console.info('fahrenheit', fahrenheit);
        updateLed(celsius, led)
        // led.off();
      });
    };
    // read the temperature now
    readTemperature();
    // and every 1 second
    setInterval(readTemperature, 1000);
  });
});


function updateLed(temp, led) {
  var h = (30 - temp) * 2
  setHue(h, led)
}

function setHue(h, led) {
  led.color(rgbToHex.apply(null, hslToRgb(h / 256, 1, 0.5)))
}

function hslToRgb(h, s, l){
  var r, g, b;

  if(s == 0){
    r = g = b = l; // achromatic
  }else{
    function hue2rgb(p, q, t){
      if(t < 0) t += 1;
      if(t > 1) t -= 1;
      if(t < 1/6) return p + (q - p) * 6 * t;
      if(t < 1/2) return q;
      if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

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

var pin = 2;
var board = new five.Board();

board.on('ready', function () {

  var led = new five.Led(13)

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
      led.on();

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
        led.off();
      });
    };
    // read the temperature now
    readTemperature();
    // and every five seconds
    setInterval(readTemperature, 1000);
  });
});

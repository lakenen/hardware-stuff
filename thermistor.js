var five = require('johnny-five')

var POTENTIAL_DIVIDER_RESISTOR = 10000
  , THERMISTOR_B_VALUE = 3977
  , THERMISTOR_REF_TEMP = 298.15
  , THERMISTOR_REF_RESISTANCE = 10000

function calculate(value) {
  // console.log(value)
  var voltage = value / 1024 * 3.3
    , resistance = POTENTIAL_DIVIDER_RESISTOR / (3.3 / voltage - 1)
    , temp = 1 / (1/THERMISTOR_REF_TEMP + Math.log(resistance / THERMISTOR_REF_RESISTANCE) / THERMISTOR_B_VALUE)
  return k2f(temp)
}

function k2c(k) {
  return k - 273.15
}
function c2f(c) {
  return (c * 9) / 5 + 32
}
function k2f(k) {
  return c2f(k2c(k))
}

new five.Board().on('ready', function() {

  function doAvg(name, arr, num) {
    return function() {
      arr.push(this.value)
      if (arr.length === num) {
        var avg = arr.reduce(function (a, b) {
          return a + b
        }, 0) / num
        arr.length = 0
        console.log(name, calculate(avg))
      }
    }
  }
  var s1 = [], s2 = []
  var sensor1 = new five.Sensor({ pin: 'A0', freq: 100 })
  sensor1.on('data', doAvg(1, s1, 10))
  var sensor2 = new five.Sensor({ pin: 'A1', freq: 100 })
  sensor2.on('data', doAvg(2, s2, 10))
})

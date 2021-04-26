// https://github.com/mochajs/mocha/wiki/Third-party-reporters
// mocha --reporter my-reporter.js

/*
var mocha = require('mocha');

function MyReporter(runner) {
  mocha.reporters.Base.call(this, runner);
  var passes = 0;
  var failures = 0;

  runner.on('pass', (test) => {
    passes++;
    console.log('pass: %s', test.fullTitle());
  });

  runner.on('fail', (test, err) => {
    failures++;
    console.log('fail: %s -- error: %s', test.fullTitle(), err.message);
  });

  runner.on('end', () => {
    console.log('end: %d/%d', passes, passes + failures);
  });

}

module.exports = MyReporter;
*/

// To have this reporter "extend" a built-in reporter uncomment the following line:
// mocha.utils.inherits(MyReporter, mocha.reporters.Spec);
var createNamespace = require('continuation-local-storage').createNamespace;
var context = createNamespace('ctx');

module.exports = { context };

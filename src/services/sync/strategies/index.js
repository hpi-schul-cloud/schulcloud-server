const LDAPSystemSyncer = require('./LDAPSystemSyncer');
const CSVSyncer = require('./CSVSyncer');
const { TSPBaseSyncer } = require('./TSP/TSPBaseSyncer');

module.exports = [LDAPSystemSyncer, CSVSyncer, TSPBaseSyncer];

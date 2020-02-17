const LDAPSystemSyncer = require('./LDAPSystemSyncer');
const CSVSyncer = require('./CSVSyncer');
const { TSPBaseSyncer, TSPSchoolSyncer } = require('./TSP');

module.exports = [LDAPSystemSyncer, CSVSyncer, TSPBaseSyncer, TSPSchoolSyncer];

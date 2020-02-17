const LDAPSystemSyncer = require('./LDAPSystemSyncer');
const CSVSyncer = require('./CSVSyncer');
const { TSPBaseSyncer, TSPSchoolSyncer } = require('./TSP');
const { WebUntisSyncer } = require('./WebUntis');

module.exports = [LDAPSystemSyncer, CSVSyncer, TSPBaseSyncer, TSPSchoolSyncer, WebUntisSyncer];

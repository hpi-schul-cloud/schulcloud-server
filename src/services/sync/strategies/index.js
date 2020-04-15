const LDAPSystemSyncer = require('./LDAPSystemSyncer');
const CSVSyncer = require('./CSVSyncer');
const { TSPBaseSyncer, TSPSchoolSyncer } = require('./TSP');
const WebUntisSyncer = require('./WebUntisSyncer');

module.exports = [LDAPSystemSyncer, CSVSyncer, TSPBaseSyncer, TSPSchoolSyncer, WebUntisSyncer];

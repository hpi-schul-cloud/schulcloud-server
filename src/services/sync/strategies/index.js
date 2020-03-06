const LDAPSystemSyncer = require('./LDAPSystemSyncer');
const CSVSyncer = require('./CSVSyncer');
const { TSPBaseSyncer, TSPSchoolSyncer } = require('./TSP');
const { WebUntisSchoolyearSyncer } = require('./WebUntis');

module.exports = [LDAPSystemSyncer, CSVSyncer, TSPBaseSyncer, TSPSchoolSyncer, WebUntisSchoolyearSyncer];

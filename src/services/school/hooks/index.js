const setDefaultFileStorageType = require('./setDefaultFileStorageType');
const setCurrentYearIfMissing = require('./setCurrentYearIfMissing');
const validateOfficialSchoolNumber = require('./validateOfficialSchoolNumber');
const validateCounty = require('./validateCounty');
const restrictToUserSchool = require('./restrictToUserSchool');
const isNotAuthenticated = require('./isNotAuthenticated');
const populateInQuery = require('./populateInQuery');
const decorateYears = require('./decorateYears');
const setStudentsCanCreateTeams = require('./setStudentsCanCreateTeams');
const createDefaultStorageOptions = require('./createDefaultStorageOptions');
const hasEditPermissions = require('./hasEditPermissions');

module.exports = {
    setDefaultFileStorageType,
    setCurrentYearIfMissing,
    validateOfficialSchoolNumber,
    validateCounty,
    restrictToUserSchool,
    isNotAuthenticated,
    populateInQuery,
    decorateYears,
    setStudentsCanCreateTeams,
    createDefaultStorageOptions,
    hasEditPermissions,
};

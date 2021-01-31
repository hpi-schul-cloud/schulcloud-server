const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider, discard, disallow, keepInArray, keep } = require('feathers-hooks-common');

const { authenticateWhenJWTExist, hasPermission, ifNotLocal, lookupSchool, isSuperHero } = require('../../hooks');
const {
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
} = require('./hooks');

module.exports = {
    before: {
        all: [authenticateWhenJWTExist],
        find: [],
        get: [],
        create: [
            authenticate('jwt'),
            hasPermission('SCHOOL_CREATE'),
            setDefaultFileStorageType,
            setCurrentYearIfMissing,
            validateOfficialSchoolNumber,
            validateCounty,
        ],
        update: [
            authenticate('jwt'),
            hasPermission('SCHOOL_EDIT'),
            ifNotLocal(lookupSchool),
            ifNotLocal(restrictToUserSchool),
            validateOfficialSchoolNumber,
            validateCounty,
        ],
        patch: [
            authenticate('jwt'),
            ifNotLocal(hasEditPermissions),
            ifNotLocal(lookupSchool),
            ifNotLocal(restrictToUserSchool),
            validateOfficialSchoolNumber,
            validateCounty,
        ],
        /* It is disabled for the moment, is added with new "Löschkonzept"
        remove: [authenticate('jwt'), hasPermission('SCHOOL_CREATE')]
        */
        remove: [disallow('rest')],
    },
    after: {
        all: [
            // todo: remove id if possible (shouldn't exist)
            iff(isNotAuthenticated, keep('name', 'purpose', 'systems', '_id', 'id', 'language', 'timezone')),
            iff(populateInQuery, keepInArray('systems', ['_id', 'type', 'alias', 'ldapConfig.active', 'ldapConfig.provider', 'ldapConfig.rootPath',])),
            iff(isProvider('external') && !isSuperHero(), discard('storageProvider')),
        ],
        find: [decorateYears, setStudentsCanCreateTeams],
        get: [decorateYears, setStudentsCanCreateTeams],
        create: [createDefaultStorageOptions],
        update: [],
        patch: [],
        remove: [],
    }
};
const { fileStorageTypes } = require('../schools.model');
const { Configuration } = require('@hpi-schul-cloud/commons');

/**
 * Safe function to retrieve result data from context
 * The function returns context.result.data if the result is paginated or context.result if not.
 * If context doesn't contain result than empty list is returned
 * @param context
 * @returns {*}
 */
module.exports.getResultDataFromContext = (context) => (context.result ? context.result.data || context.result:[]);

module.exports.getDefaultFileStorageType = () => {
    if (!fileStorageTypes || !fileStorageTypes.length) {
        return undefined;
    }
    return fileStorageTypes[0];
};

module.exports.isTeamCreationByStudentsEnabled = (currentSchool) => {
    const { enableStudentTeamCreation } = currentSchool;
    const STUDENT_TEAM_CREATION_SETTING = Configuration.get('STUDENT_TEAM_CREATION');
    let isTeamCreationEnabled = false;
    switch (STUDENT_TEAM_CREATION_SETTING) {
        case 'enabled':
            // if enabled student team creation feature should be enabled
            isTeamCreationEnabled = true;
            break;
        case 'disabled':
            // if disabled student team creation feature should be disabled
            isTeamCreationEnabled = false;
            return false;
        case 'opt-in':
            // if opt-in student team creation should be enabled by admin
            // if undefined/null then false
            isTeamCreationEnabled = enableStudentTeamCreation===true;
            break;
        case 'opt-out':
            // if opt-out student team creation should be disabled by admin
            // if undefined/null then true
            isTeamCreationEnabled = enableStudentTeamCreation!==false;
            break;
        default:
            break;
    }
    return isTeamCreationEnabled;
};
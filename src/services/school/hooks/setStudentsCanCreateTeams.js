const logger = require('../../../logger');
const { getResultDataFromContext } = require('./common');
const { Configuration } = require('@hpi-schul-cloud/commons');
const {isTeamCreationByStudentsEnabled} = require('./common')

module.exports = async (context) => {
    try {
        switch (context.method) {
            case 'find':
                // if the result was paginated it contains context.result.data, otherwise context.result
                getResultDataFromContext(context).forEach((school) => {
                    school.isTeamCreationByStudentsEnabled = isTeamCreationByStudentsEnabled(school);
                });
                break;
            case 'get':
                context.result.isTeamCreationByStudentsEnabled = isTeamCreationByStudentsEnabled(context.result);
                break;
            default:
                throw new Error('method not supported');
        }
    } catch (error) {
        logger.error(error);
    }
    return context;
};
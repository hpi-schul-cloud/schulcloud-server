const logger = require('../../../logger');
const SchoolYearFacade = require('../logic/year');
const { getYears } = require('./setCurrentYearIfMissing');
const { getResultDataFromContext } = require('./common');

module.exports = async (context) => {
    let years = await getYears(context.app);

    try {
        switch (context.method) {
            case 'find':
                getResultDataFromContext(context).forEach((school) => addYearsToSchool(school, years));
                break;
            case 'get':
                addYearsToSchool(context.result);
                break;
            default:
                throw new Error(`method ${context.method} not supported`);
        }
    } catch (error) {
        logger.error(error);
    }
    return context;
};

const addYearsToSchool = (school, years) => {
    const facade = new SchoolYearFacade(years, school);
    school.years = facade.toJSON();
};
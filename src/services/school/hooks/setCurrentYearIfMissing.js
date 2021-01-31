const SchoolYearFacade = require('../logic/year');

module.exports = async (context) => {
    if (!context.data.currentYear) {
        const facade = new SchoolYearFacade(await getYears(context.app), context.data);
        context.data.currentYear = facade.defaultYear;
    }
    return context;
};

const getYears = async (app) => {
    return await app.service('years').Model.find().lean().exec();
};
module.exports.getYears = getYears;

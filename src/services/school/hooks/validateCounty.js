const { hasRole } = require('../../../hooks');

module.exports = async (context) => {
    if (context && context.data && context.data.county) {
        const schools = await context.app.service('schools').find({
            query: {
                _id: context.id,
                $populate: 'federalState',
                $limit: 1,
            },
        });
        const currentSchool = schools.data[0];
        if (!currentSchool) {
            throw new Error(`Internal error`);
        }

        const isSuperHero = await hasRole(context, context.params.account.userId, 'superhero');

        const { county } = context.data;
        if (!isSuperHero && stateHasNoMatchingCounty(currentSchool, county)) {
            throw new Error(`The state doesn't not have a matching county`);
        }

        /* Tries to replace the existing county with a new one */
        if (!isSuperHero && currentSchool.county && JSON.stringify(currentSchool.county)!==JSON.stringify(county)) {
            throw new Error(`This school already have a county`);
        }

        context.data.county = currentSchool.federalState.counties.find((c) => {
            return c._id.toString()===county.toString();
        });
    }
    // checks for empty value and deletes it from context
    if (context && context.data && Object.keys(context.data).includes('county') && !context.data.county) {
        delete context.data.county;
    }
    return context;
};

const stateHasNoMatchingCounty = (currentSchool, county) => {
    return (!currentSchool.federalState.counties.length || !currentSchool.federalState.counties.some((c) => c._id.toString()===county.toString()));
};
const {hasRole} = require('../../../hooks')

module.exports = async (context) => {
    if (context && context.data && context.data.officialSchoolNumber) {
        const { officialSchoolNumber } = context.data;
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
        if (!isSuperHero && currentSchool.officialSchoolNumber) {
            throw new Error(`This school already have an officialSchoolNumber`);
        }
        // eg: 'BE-16593' or '16593'
        const officialSchoolNumberFormat = RegExp('\\D{0,2}-*\\d{5}$');
        if (!officialSchoolNumberFormat.test(officialSchoolNumber)) {
            throw new Error(`
			School number is incorrect.\n The format should be 'AB-12345' or '12345' (without the quotations)
			`);
        }
    }
    return context;
};

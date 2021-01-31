const { hasRole } = require('../../../hooks');
const { Forbidden } = require('../../../errors');
const { equal } = require('../../../helper/compare').ObjectId;

module.exports = async (context) => {
    const isSuperHero = await hasRole(context, context.params.account.userId, 'superhero');
    if (isSuperHero || equal(context.id, context.params.account.schoolId)) {
        return context;
    }
    throw new Forbidden('You can only edit your own school.');
};

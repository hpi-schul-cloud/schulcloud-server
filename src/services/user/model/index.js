const mongoose = require('mongoose');

const { UserModel } = require('../../../components/user/repo/db/user.schema');
const { registrationPinSchema } = require('./registrationPin.schema');

/* virtual property functions */

const displayName = (user) => `${user.firstName} ${user.lastName}`;

const registrationPinModel = mongoose.model('registrationPin', registrationPinSchema);

module.exports = {
	userModel: UserModel,
	registrationPinModel,
	displayName,
};

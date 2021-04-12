const mongoose = require('mongoose');

const { userSchema, USER_FEATURES } = require('./user.schema');
const { registrationPinSchema } = require('./registrationPin.schema');

/* virtual property functions */

const displayName = (user) => `${user.firstName} ${user.lastName}`;

const registrationPinModel = mongoose.model('registrationPin', registrationPinSchema);
const userModel = mongoose.model('user', userSchema);

module.exports = {
	USER_FEATURES,
	userModel,
	registrationPinModel,
	displayName,
};

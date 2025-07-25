const mongoose = require('mongoose');

const { userSchema } = require('./user.schema');
const { registrationPinSchema } = require('./registrationPin.schema');

/* virtual property functions */

const displayName = (user) => `${user.firstName} ${user.lastName}`;

const registrationPinModel = mongoose.model('registrationPin', registrationPinSchema);
const userModel = mongoose.model('user', userSchema);

module.exports = {
	userModel,
	registrationPinModel,
	displayName,
};

const userRepo = require('./user.repo');
const accountRepo = require('./account.repo');
const trashbinRepo = require('./trashbin.repo');
const registrationPinRepo = require('./registrationPin.repo');

module.exports = {
	accountRepo,
	registrationPinRepo,
	trashbinRepo,
	userRepo,
};

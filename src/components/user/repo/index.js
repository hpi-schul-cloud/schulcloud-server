const userRepo = require('./user.repo');
const accountRepo = require('./account.repo');
const trashbinRepo = require('./trashbin.repo');
const pseudonymRepo = require('./pseudonym.repo');

module.exports = {
	userRepo,
	trashbinRepo,
	accountRepo,
	pseudonymRepo,
};

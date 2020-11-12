const UserRepo = require('./user.repo');
const AccountRepo = require('./account.repo');
const TrashbinRepo = require('./trashbin.repo');
const disallow = require('../../../common/disallow.hook');

module.exports = function setUpRepos(app) {
	app.use('/accountRepo', new AccountRepo());
	app.service('accountRepo').hooks(disallow);

	app.use('/userRepo', new UserRepo());
	app.service('userRepo').hooks(disallow);

	app.use('/trashbinRepo', new TrashbinRepo());
	app.service('trashbinRepo').hooks(disallow);
};

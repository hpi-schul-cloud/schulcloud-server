const {
	monthlyUsers, weeklyUsers, weeklyActivity, roleActivity,
} = require('./services');


module.exports = (app) => {
	app.configure(monthlyUsers);
	app.configure(weeklyUsers);
	app.configure(weeklyActivity);
	app.configure(roleActivity);
};

const {
	monthlyUsers, weeklyUsers, weeklyActivity, roleActivity,
	weeklyActiveUsers, dauOverMau, uniquePageCount, avgTimeToInteractive, avgPageLoaded,
} = require('./services');

// todo, extract cubejs to .env
module.exports = (app) => {
	app.configure(monthlyUsers);
	app.configure(weeklyUsers);
	app.configure(weeklyActivity);
	app.configure(roleActivity);
	app.configure(weeklyActiveUsers);
	app.configure(dauOverMau);
	app.configure(uniquePageCount);
	app.configure(avgTimeToInteractive);
	app.configure(avgPageLoaded);
};

const { CoursesServiceV2, hooks } = require('./courses.service.v2');

module.exports = (app) => {
	const courseRoute = '/users/v2/courses';
	app.use(courseRoute, new CoursesServiceV2());
	app.service(courseRoute).hooks(hooks);
};

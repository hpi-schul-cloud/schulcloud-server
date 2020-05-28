const {
	Project,
	Board,
} = require('./services');

const hooks = require('./hooks');

module.exports = (app) => {
	const projectRoute = '/nexboard/projects';
	const boardRoute = '/nexboard/boards';

	app.use(projectRoute, new Project());
	app.use(boardRoute, new Board());

	const projects = app.service(projectRoute);
	projects.hooks(hooks);

	const boards = app.service(boardRoute);
	boards.hooks(hooks);
};

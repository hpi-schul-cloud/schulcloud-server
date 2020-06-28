const {
	Board,
	BoardHooks,
} = require('./Boards');

const {
	Project,
	ProjectHooks,
} = require('./Projects');

module.exports = (app) => {
	const projectRoute = '/nexboard/projects';
	const boardRoute = '/nexboard/boards';

	app.use(projectRoute, new Project());
	app.use(boardRoute, new Board());

	const projects = app.service(projectRoute);
	projects.hooks(ProjectHooks);

	const boards = app.service(boardRoute);
	boards.hooks(BoardHooks);
};

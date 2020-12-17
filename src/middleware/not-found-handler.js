const reqlib = require('app-root-path').require;

const { PageNotFound } = reqlib('src/errors');
// todo do not work well with error handling, it is produce a 404 and pass it 500er Internal Error
module.exports = (req, res, next) => {
	next(new PageNotFound());
};

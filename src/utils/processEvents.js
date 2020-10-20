const reqlib = require('app-root-path').require;

const { UnhandledRejection, UnhandledException } = reqlib('src/errors');

module.exports = (logger) => {
	process
		.on('unhandledRejection', async (reason, promise) => {
			let result = null;
			try {
				result = await promise.catch((err) => err);
			} catch (err) {
				result = err;
			}
			logger.error(new UnhandledRejection('Unhandled Rejection.', { promise, result, reason }));
		})
		.on('unhandledException', (e) => {
			logger.error(new UnhandledException('Unhandled Exception', e));
		});
};

module.exports = (logger) => {
	process
		.on('unhandledRejection', async (reason, promise) => {
			let result = null;
			try {
				result = await promise.catch((err) => err);
			} catch (err) {
				result = err;
			}
			logger.error('Unhandled Rejection at: Promise', promise, 'reason:', reason, 'result:', result);
		})
		.on('unhandledException', (e) => {
			logger.error('Unhandled Exception', e);
		});
};

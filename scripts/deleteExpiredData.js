const { facadeLocator } = require('../src/utils/facadeLocator');

const appPromise = require('../src/app');

appPromise
	.then(async () => {
		const userFacade = facadeLocator.facade('users/v2');
		await userFacade.cleanupTrashbin();
		return process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		return process.exit(1);
	});

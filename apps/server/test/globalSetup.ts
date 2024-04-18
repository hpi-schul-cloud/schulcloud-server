import { MongoMemoryServer } from 'mongodb-memory-server-global';

export = async function globalSetup() {
	const instance = await MongoMemoryServer.create({
		binary: {
			version: '5.0.26',
		},
	});
	const uri = instance.getUri();
	global.__MONGOINSTANCE = instance;
	// eslint-disable-next-line no-process-env
	process.env.MONGO_TEST_URI = uri.slice(0, uri.lastIndexOf('/'));
};

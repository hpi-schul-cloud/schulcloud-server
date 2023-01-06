import { MongoMemoryServer } from 'mongodb-memory-server-global-4.4';

export = async function globalTeardown() {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const instance: MongoMemoryServer = global.__MONGOINSTANCE;
	await instance.stop();
};

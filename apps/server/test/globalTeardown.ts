import { MongoMemoryServer } from 'mongodb-memory-server-global';

export = async function globalTeardown() {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const instance: MongoMemoryServer = global.__MONGOINSTANCE;
	await instance.stop();
};

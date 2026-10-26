import { MongoClient } from 'mongodb';
import { MongoIoAdapter } from './mongodb-ioadapter';

describe(MongoIoAdapter.name, () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should dispose without a database connection', async () => {
		const adapter = new MongoIoAdapter();

		await expect(adapter.dispose()).resolves.toBeUndefined();
	});

	it('should close its MongoDB client when disposed', async () => {
		const closeSpy = jest.spyOn(MongoClient.prototype, 'close');
		const adapter = new MongoIoAdapter();
		// eslint-disable-next-line no-process-env
		const dbUrl = process.env.MONGO_TEST_URI;
		if (!dbUrl) {
			throw new Error('MONGO_TEST_URI is required');
		}

		await adapter.connectToMongoDb({ dbUrl, dbEnsureIndexes: false, dbDebug: false });
		await adapter.dispose();

		expect(closeSpy).toHaveBeenCalledTimes(1);
		expect(closeSpy.mock.instances[0]).toBeInstanceOf(MongoClient);
	});
});

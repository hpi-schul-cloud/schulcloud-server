import { faker } from '@faker-js/faker';
import { TspDataSyncBatchFinishedLoggable } from './tsp-data-sync-batch-finished.loggable';

describe(TspDataSyncBatchFinishedLoggable.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const processedCount = faker.number.int();
			const batchSize = faker.number.int();
			const batchCount = faker.number.int();
			const batchIndex = faker.number.int();

			const expected = {
				message: `Processed ${processedCount} of ${batchSize} users in batch ${batchIndex} of ${batchCount}.`,
				data: {
					processedCount,
					batchSize,
					batchCount,
					batchIndex,
				},
			};

			return { processedCount, batchSize, batchCount, batchIndex, expected };
		};

		it('should return a log message', () => {
			const { processedCount, batchSize, batchCount, batchIndex, expected } = setup();

			const loggable = new TspDataSyncBatchFinishedLoggable(processedCount, batchSize, batchCount, batchIndex);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});

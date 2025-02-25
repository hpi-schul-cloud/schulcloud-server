import { faker } from '@faker-js/faker';
import { TspClassSyncSummaryLoggable } from './tsp-class-sync-summary.loggable';

describe(TspClassSyncSummaryLoggable.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const totalClassUpdateCount = faker.number.int();
			const totalClassCreationCount = faker.number.int();

			const expected = {
				message: `In total updated ${totalClassUpdateCount} classes and created ${totalClassCreationCount} classes.`,
				data: {
					totalClassUpdateCount,
					totalClassCreationCount,
				},
			};

			return { totalClassUpdateCount, totalClassCreationCount, expected };
		};

		it('should return a log message', () => {
			const { totalClassUpdateCount, totalClassCreationCount, expected } = setup();

			const loggable = new TspClassSyncSummaryLoggable(totalClassUpdateCount, totalClassCreationCount);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});

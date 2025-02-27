import { faker } from '@faker-js/faker';
import { TspClassSyncBatchLoggable } from './tsp-class-sync-batch.loggable';

describe(TspClassSyncBatchLoggable.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const classUpdateCount = faker.number.int();
			const classCreationCount = faker.number.int();
			const schoolExternalId = faker.string.uuid();

			const expected = {
				message: `Updated ${classUpdateCount} classes and created ${classCreationCount} classes for external school ${schoolExternalId}.`,
				data: {
					classUpdateCount,
					classCreationCount,
					schoolExternalId,
				},
			};

			return { classUpdateCount, classCreationCount, schoolExternalId, expected };
		};

		it('should return a log message', () => {
			const { classUpdateCount, classCreationCount, schoolExternalId, expected } = setup();

			const loggable = new TspClassSyncBatchLoggable(classUpdateCount, classCreationCount, schoolExternalId);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});

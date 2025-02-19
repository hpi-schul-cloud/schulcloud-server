import { faker } from '@faker-js/faker';
import { TspClassSyncStartLoggable } from './tsp-class-sync-start.loggable';

describe(TspClassSyncStartLoggable.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const count = faker.number.int();

			const expected = {
				message: `Syncing ${count} classes.`,
				data: {
					count,
				},
			};

			return { count, expected };
		};

		it('should return a log message', () => {
			const { count, expected } = setup();

			const loggable = new TspClassSyncStartLoggable(count);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});

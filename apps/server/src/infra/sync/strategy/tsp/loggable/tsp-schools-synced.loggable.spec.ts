import { faker } from '@faker-js/faker';
import { TspSchoolsSyncedLoggable } from './tsp-schools-synced.loggable';

describe(TspSchoolsSyncedLoggable.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const tspSchoolCount = faker.number.int();
			const processedSchools = faker.number.int();
			const createdSchools = faker.number.int();
			const updatedSchools = faker.number.int();

			const expected = {
				message: `Synced schools: Of ${tspSchoolCount} schools ${processedSchools} were processed. ${createdSchools} were created and ${updatedSchools} were updated`,
				data: {
					tspSchoolCount,
					processedSchools,
					createdSchools,
					updatedSchools,
				},
			};

			return { tspSchoolCount, processedSchools, createdSchools, updatedSchools, expected };
		};

		it('should return a log message', () => {
			const { tspSchoolCount, processedSchools, createdSchools, updatedSchools, expected } = setup();

			const loggable = new TspSchoolsSyncedLoggable(tspSchoolCount, processedSchools, createdSchools, updatedSchools);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});

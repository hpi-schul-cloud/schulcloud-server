import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { SchoolNotMigratedLoggableException } from './school-not-migrated.loggable-exception';

describe(SchoolNotMigratedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const schoolId: EntityId = new ObjectId().toHexString();

			const loggable = new SchoolNotMigratedLoggableException(schoolId);

			return {
				loggable,
				schoolId,
			};
		};

		it('should return error log message', () => {
			const { loggable, schoolId } = setup();

			const result = loggable.getLogMessage();

			expect(result).toEqual({
				type: 'SCHOOL_NOT_MIGRATED',
				message: 'The school administrator started the migration for his school.',
				stack: expect.any(String),
				data: {
					schoolId,
				},
			});
		});
	});
});

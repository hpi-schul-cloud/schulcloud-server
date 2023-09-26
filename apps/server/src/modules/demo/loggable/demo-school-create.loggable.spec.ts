import { CrudOperation } from '@shared/types';
import { DemoSchoolCreateLoggable } from './demo-school-create.loggable';

describe(DemoSchoolCreateLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const userId = 'fakeId';

			const loggable = new DemoSchoolCreateLoggable(userId);

			return { userId, loggable };
		};

		it('should log the correct message', () => {
			const { loggable, userId } = setup();

			const result = loggable.getLogMessage();

			expect(result).toEqual({
				message: expect.any(String),
				data: {
					operation: CrudOperation.CREATE,
					userId,
				},
			});
		});
	});
});

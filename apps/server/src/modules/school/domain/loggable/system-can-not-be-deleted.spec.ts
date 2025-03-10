import { SchoolErrorEnum } from './error.enum';
import { SystemCanNotBeDeletedLoggableException } from './system-can-not-be-deleted.loggable-exception';

describe('SystemCanNotBeDeletedLoggableException', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const exception = new SystemCanNotBeDeletedLoggableException('systemId');

			const result = exception.getLogMessage();

			expect(result).toStrictEqual({
				type: SchoolErrorEnum.SYSTEM_CAN_NOT_BE_DELETED,
				stack: exception.stack,
				data: {
					systemId: 'systemId',
				},
			});
		});
	});
});

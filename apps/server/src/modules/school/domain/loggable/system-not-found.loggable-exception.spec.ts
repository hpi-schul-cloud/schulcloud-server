import { SchoolErrorEnum } from './error.enum';
import { SystemNotFoundLoggableException } from './system-not-found.loggable-exception';

describe('SystemNotFoundLoggableException', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const exception = new SystemNotFoundLoggableException('systemId');

			const result = exception.getLogMessage();

			expect(result).toStrictEqual({
				type: SchoolErrorEnum.SYSTEM_NOT_FOUND,
				stack: exception.stack,
				data: {
					systemId: 'systemId',
				},
			});
		});
	});
});

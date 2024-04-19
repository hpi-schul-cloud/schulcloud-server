import { ErrorUtils } from '@src/core/error/utils';
import { EtherpadErrorType } from '../interface';
import { EtherpadErrorLoggableException } from './etherpad-error-loggable-exception';

describe('EtherpadErrorLoggableException', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const type = EtherpadErrorType.BAD_REQUEST;
			const payload = {
				userId: 'userId',
				parentId: 'parentId',
			};
			const error = new Error('error');
			const httpExceptionOptions = ErrorUtils.createHttpExceptionOptions(error);

			const exception = new EtherpadErrorLoggableException(type, payload, httpExceptionOptions);
			const result = exception.getLogMessage();

			expect(result).toStrictEqual({
				type: 'BAD_REQUEST',
				stack: exception.stack,
				data: {
					userId: 'userId',
					parentId: 'parentId',
				},
			});
		});
	});
});

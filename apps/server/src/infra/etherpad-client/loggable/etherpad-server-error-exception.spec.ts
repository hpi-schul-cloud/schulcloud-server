import { ErrorUtils } from '@src/core/error/utils';
import { ErrorType } from '../interface';
import { EtherpadServerError } from './etherpad-server-error-exception';

describe('EtherpadServerErrorException', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const type = ErrorType.ETHERPAD_SERVER_BAD_REQUEST;
			const payload = {
				userId: 'userId',
				parentId: 'parentId',
			};
			const error = new Error('error');
			const httpExceptionOptions = ErrorUtils.createHttpExceptionOptions(error);

			const exception = new EtherpadServerError(type, payload, httpExceptionOptions);
			const result = exception.getLogMessage();

			expect(result).toStrictEqual({
				type: 'ETHERPAD_SERVER_BAD_REQUEST',
				stack: exception.stack,
				data: {
					userId: 'userId',
					parentId: 'parentId',
				},
			});
		});
	});
});

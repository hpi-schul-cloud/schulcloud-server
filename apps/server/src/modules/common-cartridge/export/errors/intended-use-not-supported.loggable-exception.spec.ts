import { CommonCartridgeErrorEnum } from './error.enum';
import { IntendedUseNotSupportedLoggableException } from './intended-use-not-supported.loggable-exception';

describe('IntendedUseNotSupportedLoggableException', () => {
	describe('getLogMessage', () => {
		describe('when getting log message', () => {
			const exception = new IntendedUseNotSupportedLoggableException('notSupportedIntendedUse');

			it('should return log message', () => {
				const result = exception.getLogMessage();

				expect(result).toStrictEqual({
					type: CommonCartridgeErrorEnum.INTENDED_USE_NOT_SUPPORTED,
					stack: exception.stack,
					data: {
						intendedUse: 'notSupportedIntendedUse',
						message: 'Common Cartridge intended use notSupportedIntendedUse is not supported',
					},
				});
			});
		});
	});
});

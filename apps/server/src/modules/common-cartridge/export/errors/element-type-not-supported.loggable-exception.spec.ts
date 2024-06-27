import { ElementTypeNotSupportedLoggableException } from './element-type-not-supported.loggable-exception';
import { CommonCartridgeErrorEnum } from './error.enums';

describe('ElementTypeNotSupportedLoggableException', () => {
	describe('getLogMessage', () => {
		describe('when getting log message', () => {
			const exception = new ElementTypeNotSupportedLoggableException('notSupportedType');

			it('should return log message', () => {
				const result = exception.getLogMessage();

				expect(result).toStrictEqual({
					type: CommonCartridgeErrorEnum.ELEMENT_TYPE_NOT_SUPPORTED,
					stack: exception.stack,
					data: {
						type: 'notSupportedType',
						message: 'Common Cartridge element type notSupportedType is not supported',
					},
				});
			});
		});
	});
});

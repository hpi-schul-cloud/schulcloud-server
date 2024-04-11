import { CommonCartridgeErrorEnum } from './error.enum';
import { ResourceTypeNotSupportedLoggableException } from './resource-type-not-supported.loggable-exception';

describe('ResourceTypeNotSupportedLoggableException', () => {
	describe('getLogMessage', () => {
		describe('when getting log message', () => {
			const exception = new ResourceTypeNotSupportedLoggableException('notSupportedType');

			it('should return log message', () => {
				const result = exception.getLogMessage();

				expect(result).toStrictEqual({
					type: CommonCartridgeErrorEnum.RESOURCE_TYPE_NOT_SUPPORTED,
					stack: exception.stack,
					data: {
						type: 'notSupportedType',
						message: 'Common Cartridge resource type notSupportedType is not supported',
					},
				});
			});
		});
	});
});

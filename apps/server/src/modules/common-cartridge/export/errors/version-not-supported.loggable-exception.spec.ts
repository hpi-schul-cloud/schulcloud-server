import { CommonCartridgeErrorEnum } from './error.enums';
import { VersionNotSupportedLoggableException } from './version-not-supported.loggable-exception';

describe('VersionNotSupportedLoggableException', () => {
	describe('getLogMessage', () => {
		describe('when getting log message', () => {
			const exception = new VersionNotSupportedLoggableException('notSupportedVersion');

			it('should return log message', () => {
				const result = exception.getLogMessage();

				expect(result).toStrictEqual({
					type: CommonCartridgeErrorEnum.VERSION_NOT_SUPPORTED,
					stack: exception.stack,
					data: {
						version: 'notSupportedVersion',
						message: 'Common Cartridge version notSupportedVersion is not supported',
					},
				});
			});
		});
	});
});

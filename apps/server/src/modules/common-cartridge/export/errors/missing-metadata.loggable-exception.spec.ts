import { CommonCartridgeErrorEnum } from './error.enums';
import { MissingMetadataLoggableException } from './missing-metadata.loggable-exception';

describe('MissingMetadataLoggableException', () => {
	describe('getLogMessage', () => {
		describe('when getting log message', () => {
			const exception = new MissingMetadataLoggableException();

			it('should return log message', () => {
				const result = exception.getLogMessage();

				expect(result).toStrictEqual({
					type: CommonCartridgeErrorEnum.MISSING_METADATA,
					stack: exception.stack,
					data: {
						message: 'Metadata is required',
					},
				});
			});
		});
	});
});

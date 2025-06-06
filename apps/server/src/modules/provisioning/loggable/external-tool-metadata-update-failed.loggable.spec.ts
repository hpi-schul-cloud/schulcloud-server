import { LogMessage } from '@core/logger';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { mediaUserLicenseFactory } from '@modules/user-license/testing';
import { NotFoundException } from '@nestjs/common';
import { ExternalToolMetadataUpdateFailedLoggable } from './external-tool-metadata-update-failed.loggable';

describe(ExternalToolMetadataUpdateFailedLoggable.name, () => {
	describe('getLogMessage', () => {
		describe('when the error can be indentified', () => {
			const setup = () => {
				const externalTool = externalToolFactory.build();
				const license = mediaUserLicenseFactory.build();
				const error = new NotFoundException('test error');

				const loggable = new ExternalToolMetadataUpdateFailedLoggable(externalTool, license, error);

				return {
					loggable,
					externalTool,
					license,
					error,
				};
			};

			it('should return the correct log message', () => {
				const { externalTool, license, error, loggable } = setup();

				const result = loggable.getLogMessage();

				expect(result).toEqual<LogMessage>({
					message: 'Updating external tool with medium metadata failed.',
					data: {
						externalToolId: externalTool.id,
						mediumId: license.mediumId,
						mediaSourceId: license.mediaSource?.sourceId,
						error: {
							name: error.name,
							message: error.message,
						},
					},
				});
			});
		});

		describe('when the error cannot be indentified', () => {
			const setup = () => {
				const externalTool = externalToolFactory.build();
				const license = mediaUserLicenseFactory.build();
				const error = 'not an error';

				const loggable = new ExternalToolMetadataUpdateFailedLoggable(externalTool, license, error);

				return {
					loggable,
					externalTool,
					license,
				};
			};

			it('should return the correct log message', () => {
				const { externalTool, license, loggable } = setup();

				const result = loggable.getLogMessage();

				expect(result).toEqual<LogMessage>({
					message: 'Updating external tool with medium metadata failed.',
					data: {
						externalToolId: externalTool.id,
						mediumId: license.mediumId,
						mediaSourceId: license.mediaSource?.sourceId,
						error: 'Unknown error',
					},
				});
			});
		});
	});
});

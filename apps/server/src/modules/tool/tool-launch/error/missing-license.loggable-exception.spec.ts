import { ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { MissingMediaLicenseLoggableException } from '@modules/tool/tool-launch/error';

describe('MissingMediaLicenseLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const contextExternalToolId = 'contextExternalTooId';
			const medium: ExternalToolMedium = new ExternalToolMedium({ mediumId: 'mediumId', publisher: 'publisher' });
			const userId = 'userId';

			const exception = new MissingMediaLicenseLoggableException(medium, userId, contextExternalToolId);

			return {
				contextExternalToolId,
				medium,
				userId,
				exception,
			};
		};

		it('should log the correct message', () => {
			const { contextExternalToolId, medium, userId, exception } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'MISSING_MEDIA_LICENSE',
				message: 'The user does not have the required license to launch this medium.',
				stack: expect.any(String),
				data: {
					medium,
					userId,
					contextExternalToolId,
				},
			});
		});
	});
});

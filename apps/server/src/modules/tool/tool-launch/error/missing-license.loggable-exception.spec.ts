import { ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { MissingMediaLicenseLoggableException } from '@modules/tool/tool-launch/error';
import { contextExternalToolFactory } from '@shared/testing';

describe(MissingMediaLicenseLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const contextExternalTool = contextExternalToolFactory.buildWithId();
			const medium: ExternalToolMedium = new ExternalToolMedium({ mediumId: 'mediumId', publisher: 'publisher' });
			const userId = 'userId';

			const exception = new MissingMediaLicenseLoggableException(medium, userId, contextExternalTool);

			return {
				contextExternalTool,
				medium,
				userId,
				exception,
			};
		};

		it('should log the correct message', () => {
			const { contextExternalTool, medium, userId, exception } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'MISSING_MEDIA_LICENSE',
				message: 'The user does not have the required license to launch this medium.',
				stack: expect.any(String),
				data: {
					medium,
					userId,
					contextExternalToolId: contextExternalTool.id,
					schoolExternalToolId: contextExternalTool.schoolToolRef.schoolToolId,
					contextType: contextExternalTool.contextRef.type,
					contextId: contextExternalTool.contextRef.id,
				},
			});
		});
	});
});

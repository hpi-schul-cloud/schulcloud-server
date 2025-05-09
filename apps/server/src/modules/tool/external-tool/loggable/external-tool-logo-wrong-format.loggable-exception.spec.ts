import { ObjectId } from '@mikro-orm/mongodb';
import { ExternalToolLogoWrongFormatLoggableException } from './external-tool-logo-wrong-format.loggable-exception';

describe(ExternalToolLogoWrongFormatLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const toolId = new ObjectId().toHexString();

			const loggable = new ExternalToolLogoWrongFormatLoggableException(toolId);

			return {
				loggable,
				toolId,
			};
		};

		it('should return a loggable message', () => {
			const { loggable, toolId } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'EXTERNAL_TOOL_LOGO_WRONG_FORMAT',
				message: 'External tool logo has the wrong data format. A data url is required.',
				stack: loggable.stack,
				data: {
					toolId,
				},
			});
		});
	});
});

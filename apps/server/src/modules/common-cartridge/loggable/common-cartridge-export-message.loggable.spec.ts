import { faker } from '@faker-js/faker/.';
import { CommonCartridgeExportMessageLoggable } from './common-cartridge-export-message.loggable';

describe(CommonCartridgeExportMessageLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const message = faker.string.alphanumeric();
			const loggable = new CommonCartridgeExportMessageLoggable(message);

			return { loggable, message };
		};

		it('should return a loggable message', () => {
			const { loggable, message } = setup();

			const loggedMessage = loggable.getLogMessage();

			expect(loggedMessage).toEqual({
				type: 'COMMON_CARTRIDGE_MESSAGE_LOGGABLE',
				message: message,
			});
		});
	});
});

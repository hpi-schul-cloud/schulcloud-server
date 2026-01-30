import { faker } from '@faker-js/faker/.';
import { CommonCartridgeMessageLoggable } from './common-cartridge-export-message.loggable';

describe(CommonCartridgeMessageLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const message = faker.string.alphanumeric();
			const loggable = new CommonCartridgeMessageLoggable(message);

			return { loggable, message };
		};

		it('should return a loggable message', () => {
			const { loggable, message } = setup();

			const loggedMessage = loggable.getLogMessage();

			expect(loggedMessage).toEqual({
				type: 'COMMON_CARTRIDGE_EXPORT_MESSAGE_LOGGABLE',
				message: message,
			});
		});
	});
});

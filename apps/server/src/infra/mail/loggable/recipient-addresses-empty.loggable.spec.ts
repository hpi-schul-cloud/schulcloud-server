import { RecipientAddressesEmptyLoggable } from './recipient-addresses-empty.loggable';

describe('RecipientAddressesEmptyLoggable', () => {
	describe('getLogMessage', () => {
		it('should return correct message and data for single recipient', () => {
			const originalRecipients = ['test@example.com'];
			const loggable = new RecipientAddressesEmptyLoggable(originalRecipients);

			const logMessage = loggable.getLogMessage();

			expect(logMessage).toEqual({
				message: 'No valid recipient email addresses provided. Email will not be sent.',
				data: { originalRecipients: 'test@example.com' },
			});
		});

		it('should return correct message and data for multiple recipients', () => {
			const originalRecipients = ['test1@example.com', 'test2@domain.org', 'test3@sample.net'];
			const loggable = new RecipientAddressesEmptyLoggable(originalRecipients);

			const logMessage = loggable.getLogMessage();

			expect(logMessage).toEqual({
				message: 'No valid recipient email addresses provided. Email will not be sent.',
				data: { originalRecipients: 'test1@example.com, test2@domain.org, test3@sample.net' },
			});
		});

		it('should return correct message and data for empty recipients array', () => {
			const originalRecipients: string[] = [];
			const loggable = new RecipientAddressesEmptyLoggable(originalRecipients);

			const logMessage = loggable.getLogMessage();

			expect(logMessage).toEqual({
				message: 'No valid recipient email addresses provided. Email will not be sent.',
				data: { originalRecipients: '' },
			});
		});

		it('should properly join recipients with comma and space separator', () => {
			const originalRecipients = ['first@example.com', 'second@example.com'];
			const loggable = new RecipientAddressesEmptyLoggable(originalRecipients);

			const logMessage = loggable.getLogMessage();

			if (typeof logMessage.data === 'object' && logMessage.data !== null && 'originalRecipients' in logMessage.data) {
				expect((logMessage.data as { originalRecipients: string }).originalRecipients).toBe(
					'first@example.com, second@example.com'
				);
			} else {
				fail('logMessage.data does not have originalRecipients property');
			}
		});
	});
});

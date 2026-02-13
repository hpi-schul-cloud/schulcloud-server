/* Istanbul ignore file */
import { Loggable, LogMessage } from '@core/logger';

export class RecipientAddressesEmptyLoggable implements Loggable {
	constructor(private readonly originalRecipients: string[]) {}
	public getLogMessage(): LogMessage {
		return {
			message: 'No valid recipient email addresses provided. Email will not be sent.',
			data: { originalRecipients: this.originalRecipients.join(', ') },
		};
	}
}

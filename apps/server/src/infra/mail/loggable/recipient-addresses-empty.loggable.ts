/* Istanbul ignore file */
import { Loggable, LogMessage } from '@infra/logger';

export class RecipientAddressesEmptyLoggable implements Loggable {
	constructor(private readonly originalRecipients: string[]) {}
	public getLogMessage(): LogMessage {
		return {
			message: 'No valid recipient email addresses provided. Email will not be sent.',
			data: { originalRecipients: this.originalRecipients.join(', ') },
		};
	}
}

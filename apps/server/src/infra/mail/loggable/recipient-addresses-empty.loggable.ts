/* Istanbul ignore file */
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class RecipientAddressesEmptyLoggable implements Loggable {
	constructor(private readonly originalRecipients: string[]) {}
	public getLogMessage(): LoggableMessage {
		return {
			message: 'No valid recipient email addresses provided. Email will not be sent.',
			data: { originalRecipients: this.originalRecipients.join(', ') },
		};
	}
}

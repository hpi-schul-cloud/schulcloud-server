/* Istanbul ignore file */
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class SendEmailLoggable implements Loggable {
	constructor(
		public readonly recipients: string[],
		public readonly replyTo: string,
		public readonly subject: string,
		public readonly plainTextContent: string,
		public readonly attachments: boolean
	) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'Email sent successfully',
			data: {
				recipients: this.recipients.toString(),
				replyTo: this.replyTo,
				subject: this.subject,
				plainTextContent: this.plainTextContent,
				hasAttachments: this.attachments,
			},
		};
	}
}

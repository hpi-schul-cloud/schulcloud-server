import { Logger } from '@core/logger';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { InternalMailConfig } from './interfaces';
import { SendEmailLoggable } from './loggable';
import { RecipientAddressesEmptyLoggable } from './loggable/recipient-addresses-empty.loggable';
import { Mail } from './mail.interface';

@Injectable()
export class MailService {
	constructor(
		private readonly amqpConnection: AmqpConnection,
		private readonly config: InternalMailConfig,
		private readonly logger: Logger
	) {}

	public async send(data: Mail): Promise<void> {
		const { recipients: originalRecipients } = data;
		if (this.config.blocklistOfEmailDomains.length > 0) {
			data.recipients = this.filterEmailAdresses(data.recipients) as string[];
			data.cc = this.filterEmailAdresses(data.cc);
			data.bcc = this.filterEmailAdresses(data.bcc);
			data.replyTo = this.filterEmailAdresses(data.replyTo);
		}

		if (data.recipients.length === 0) {
			this.logger.warning(new RecipientAddressesEmptyLoggable(originalRecipients));
			return;
		}

		if (this.config.shouldSendEmail) {
			await this.amqpConnection.publish(this.config.exchangeName, this.config.mailSendRoutingKey, data, {
				persistent: true,
			});
		} else {
			this.logger.debug(
				new SendEmailLoggable(
					data.recipients,
					(data.replyTo || []).join(', '),
					data.mail.subject,
					data.mail.plainTextContent || data.mail.htmlContent || '',
					!!data.mail.attachments
				)
			);
		}
	}

	private filterEmailAdresses(mails: string[] | undefined): string[] | undefined {
		if (mails === undefined || mails === null) {
			return mails;
		}
		const mailWhitelist: string[] = [];

		for (const mail of mails) {
			const mailDomain = this.getMailDomain(mail);
			if (mailDomain && !this.config.blocklistOfEmailDomains.includes(mailDomain)) {
				mailWhitelist.push(mail);
			}
		}
		return mailWhitelist;
	}

	private getMailDomain(mail: string): string {
		return mail.split('@')[1];
	}
}

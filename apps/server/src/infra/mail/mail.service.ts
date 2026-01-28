import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { InternalMailConfig } from './interfaces';
import { Mail } from './mail.interface';

@Injectable()
export class MailService {
	constructor(private readonly amqpConnection: AmqpConnection, private readonly config: InternalMailConfig) {}

	public async send(data: Mail): Promise<void> {
		if (this.config.blocklistOfEmailDomains.length > 0) {
			data.recipients = this.filterEmailAdresses(data.recipients) as string[];
			data.cc = this.filterEmailAdresses(data.cc);
			data.bcc = this.filterEmailAdresses(data.bcc);
			data.replyTo = this.filterEmailAdresses(data.replyTo);
		}

		if (data.recipients.length === 0) {
			return;
		}

		await this.amqpConnection.publish(this.config.exchangeName, this.config.mailSendRoutingKey, data, {
			persistent: true,
		});
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

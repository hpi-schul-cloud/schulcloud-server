import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { Mail } from './mail.interface';

interface MailServiceOptions {
	exchange: string;
	routingKey: string;
	domainBlacklist: string[];
}

@Injectable()
export class MailService {
	constructor(
		private readonly amqpConnection: AmqpConnection,
		@Inject('MAIL_SERVICE_OPTIONS') private readonly options: MailServiceOptions
	) {}

	public async send(data: Mail): Promise<void> {
		if (this.options.domainBlacklist.length > 0) {
			data.recipients = this.filterEmailAdresses(data.recipients) as string[];
			data.cc = this.filterEmailAdresses(data.cc);
			data.bcc = this.filterEmailAdresses(data.bcc);
			data.replyTo = this.filterEmailAdresses(data.replyTo);
		}

		if (data.recipients.length === 0) {
			return;
		}

		await this.amqpConnection.publish(this.options.exchange, this.options.routingKey, data, { persistent: true });
	}

	private filterEmailAdresses(mails: string[] | undefined): string[] | undefined {
		if (mails === undefined || mails === null) {
			return mails;
		}
		const mailWhitelist: string[] = [];

		for (const mail of mails) {
			const mailDomain = this.getMailDomain(mail);
			if (mailDomain && !this.options.domainBlacklist.includes(mailDomain)) {
				mailWhitelist.push(mail);
			}
		}
		return mailWhitelist;
	}

	private getMailDomain(mail: string): string {
		return mail.split('@')[1];
	}
}

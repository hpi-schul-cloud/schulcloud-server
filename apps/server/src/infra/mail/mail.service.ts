import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailConfig } from './interfaces/mail-config';
import { Mail } from './mail.interface';

interface MailServiceOptions {
	exchange: string;
	routingKey: string;
}

@Injectable()
export class MailService {
	private readonly domainBlacklist: string[];

	constructor(
		private readonly amqpConnection: AmqpConnection,
		@Inject('MAIL_SERVICE_OPTIONS') private readonly options: MailServiceOptions,
		private readonly configService: ConfigService<MailConfig, true>
	) {
		this.domainBlacklist = this.configService.get<string[]>('ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS');
	}

	public async send(data: Mail): Promise<void> {
		if (this.domainBlacklist.length > 0) {
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
			if (mailDomain && !this.domainBlacklist.includes(mailDomain)) {
				mailWhitelist.push(mail);
			}
		}
		return mailWhitelist;
	}

	private getMailDomain(mail: string): string {
		return mail.split('@')[1];
	}
}

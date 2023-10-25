import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Mail } from './mail.interface';
import { IMailConfig } from './interfaces/mail-config';

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
		private readonly configService: ConfigService<IMailConfig, true>
	) {
		this.domainBlacklist = this.configService.get<string[]>('ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS');
	}

	public async send(data: Mail): Promise<void> {
		if (this.domainBlacklist.length > 0) {
			data.recipients = this.removeEmailAddressesThatHaveBlacklistedDomain(
				data.recipients,
				this.domainBlacklist
			) as string[];
			data.cc = this.removeEmailAddressesThatHaveBlacklistedDomain(data.cc, this.domainBlacklist);
			data.bcc = this.removeEmailAddressesThatHaveBlacklistedDomain(data.bcc, this.domainBlacklist);
			data.replyTo = this.removeEmailAddressesThatHaveBlacklistedDomain(data.replyTo, this.domainBlacklist);
		}

		if (data.recipients.length === 0) {
			return;
		}

		await this.amqpConnection.publish(this.options.exchange, this.options.routingKey, data, { persistent: true });
	}

	private removeEmailAddressesThatHaveBlacklistedDomain(
		mails: string[] | undefined,
		domainBlackList: string[]
	): string[] | undefined {
		if (mails === undefined || mails === null) {
			return mails;
		}
		const mailWhitelist: string[] = [];

		for (const mail of mails) {
			const mailDomain = this.getMailDomain(mail);
			if (mailDomain && !domainBlackList.includes(mailDomain)) {
				mailWhitelist.push(mail);
			}
		}
		return mailWhitelist;
	}

	private getMailDomain(mail: string): string {
		return mail.split('@')[1];
	}
}

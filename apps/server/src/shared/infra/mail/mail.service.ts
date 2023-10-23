import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { Configuration } from '@hpi-schul-cloud/commons/lib';

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
		@Inject('MAIL_SERVICE_OPTIONS') private readonly options: MailServiceOptions
	) {
		this.domainBlacklist = this.getDomainBlacklist();
	}

	private getDomainBlacklist(): string[] {
		if (Configuration.has('ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS')) {
			const domainBlackList = Configuration.get('ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS') as string;
			const domainBlackListArray = domainBlackList.split(',').map((domain) => domain.trim());
			return domainBlackListArray;
		}
		return [] as string[];
	}

	public async send(data: Mail): Promise<void> {
		if (this.domainBlacklist.length > 0) {
			data.recipients = this.removeEmailAddressesThatHaveBlockedDomain(
				data.recipients,
				this.domainBlacklist
			) as string[];
			data.cc = this.removeEmailAddressesThatHaveBlockedDomain(data.cc, this.domainBlacklist);
			data.bcc = this.removeEmailAddressesThatHaveBlockedDomain(data.bcc, this.domainBlacklist);
			data.replyTo = this.removeEmailAddressesThatHaveBlockedDomain(data.replyTo, this.domainBlacklist);
		}

		if (data.recipients.length === 0) {
			return;
		}

		await this.amqpConnection.publish(this.options.exchange, this.options.routingKey, data, { persistent: true });
	}

	private removeEmailAddressesThatHaveBlockedDomain(
		mails: string[] | undefined,
		domainBlackList: string[]
	): string[] | undefined {
		if (mails === undefined || mails === null) {
			return mails;
		}
		const mailWhitelist: string[] = [];

		for (const mail of mails) {
			const mailDomain = mail.split('@')[1];
			if (mailDomain && !domainBlackList.includes(mailDomain)) {
				mailWhitelist.push(mail);
			}
		}
		return mailWhitelist;
	}
}

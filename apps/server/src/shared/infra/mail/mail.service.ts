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
	constructor(
		private readonly amqpConnection: AmqpConnection,
		@Inject('MAIL_SERVICE_OPTIONS') private readonly options: MailServiceOptions
	) {}

	public async send(data: Mail): Promise<void> {
		data.recipients = this.removeEmailAddressesThatHaveBlockedDomain(data.recipients) as string[];
		data.cc = this.removeEmailAddressesThatHaveBlockedDomain(data.cc);
		data.bcc = this.removeEmailAddressesThatHaveBlockedDomain(data.bcc);
		data.replyTo = this.removeEmailAddressesThatHaveBlockedDomain(data.replyTo);

		if (data.recipients.length === 0) {
			return;
		}

		await this.amqpConnection.publish(this.options.exchange, this.options.routingKey, data, { persistent: true });
	}

	private removeEmailAddressesThatHaveBlockedDomain(mails: string[] | undefined): string[] | undefined {
		if (mails === undefined) {
			return mails;
		}
		const domainBlockList = Configuration.get('ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS') as string;
		const domainBlockListArray = domainBlockList.split(',').map((domain) => domain.trim());
		const notBlacklistedEmailsArray: string[] = [];

		for (const blockedDomain of domainBlockListArray) {
			for (const mail of mails) {
				const mailDomain = mail.split('@')[1];
				if (mailDomain !== blockedDomain) {
					notBlacklistedEmailsArray.push(mail);
				}
			}
		}
		return notBlacklistedEmailsArray;
	}
}

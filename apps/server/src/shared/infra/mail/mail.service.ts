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
		if (Configuration.has('ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS')) {
			const domainBlockList = Configuration.get('ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS') as string;
			data.recipients = this.removeEmailAddressesThatHaveBlockedDomain(data.recipients, domainBlockList) as string[];
			data.cc = this.removeEmailAddressesThatHaveBlockedDomain(data.cc, domainBlockList);
			data.bcc = this.removeEmailAddressesThatHaveBlockedDomain(data.bcc, domainBlockList);
			data.replyTo = this.removeEmailAddressesThatHaveBlockedDomain(data.replyTo, domainBlockList);
		}

		if (data.recipients.length === 0) {
			return;
		}

		await this.amqpConnection.publish(this.options.exchange, this.options.routingKey, data, { persistent: true });
	}

	private removeEmailAddressesThatHaveBlockedDomain(
		mails: string[] | undefined,
		domainBlockList: string
	): string[] | undefined {
		if (mails === undefined || mails === null) {
			return mails;
		}
		const domainBlockListArray = domainBlockList.split(',').map((domain) => domain.trim());

		for (const blockedDomain of domainBlockListArray) {
			// eslint-disable-next-line no-plusplus
			for (let i = mails.length - 1; i > -1; i--) {
				const mailDomain = mails[i].split('@')[1];
				if (mailDomain === blockedDomain) {
					mails.splice(i, 1);
				}
			}
		}
		return mails;
	}
}

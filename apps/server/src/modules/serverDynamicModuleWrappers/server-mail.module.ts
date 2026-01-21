import { MailModule } from '@infra/mail';
import { Module } from '@nestjs/common';
import { MailConfig, SERVER_MAIL_CONFIG_TOKEN } from './server-mail.config';

@Module({
	imports: [MailModule.register(MailConfig, SERVER_MAIL_CONFIG_TOKEN)],
	exports: [MailModule],
})
export class ServerMailModule {}

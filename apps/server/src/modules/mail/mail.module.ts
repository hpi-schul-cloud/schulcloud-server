import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

import { rabbitMqClient } from './rabbitMqClient';

@Module({
	imports: [rabbitMqClient],
	providers: [MailService],
	exports: [MailService],
})
export class MailModule {}

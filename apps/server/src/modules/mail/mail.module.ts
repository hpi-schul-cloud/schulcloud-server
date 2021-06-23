import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './controller/mail.controller';

import { rabbitMqClient } from './rabbitMqClient';

@Module({
	imports: [rabbitMqClient],
	controllers: [MailController],
	providers: [MailService],
	exports: [MailService],
})
export class MailModule {}

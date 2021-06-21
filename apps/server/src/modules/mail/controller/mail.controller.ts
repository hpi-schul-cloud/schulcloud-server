
import { Controller, Post, Body } from '@nestjs/common';
import { MailService } from '../mail.service';
import { CreateMailParams } from './dto/create-mail.params';

@Controller('mail')
export class MailController {
    constructor(private readonly mailService: MailService) {};

	@Post()
    async send(@Body() params: CreateMailParams) {
        this.mailService.send('sendMail', params);
        return 'Message sent to queue!';
    }
}
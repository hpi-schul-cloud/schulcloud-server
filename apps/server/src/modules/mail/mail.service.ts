import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class MailService {
	constructor(@Inject('MAIL_MODULE') private readonly client: ClientProxy) {}

	public send(pattern: string, data: any) {
		return this.client.emit(pattern, data);
	}
}

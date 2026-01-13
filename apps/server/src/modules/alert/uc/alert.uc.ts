import { Injectable } from '@nestjs/common';
import { Message } from '../controller/dto';
import { AlertCacheService } from '../service';

@Injectable()
export class AlertUc {
	constructor(private readonly cacheService: AlertCacheService) {}

	public find(): Promise<Message[]> {
		return this.cacheService.getMessages();
	}
}

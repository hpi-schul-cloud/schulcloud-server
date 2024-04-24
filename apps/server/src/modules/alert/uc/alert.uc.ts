import { Injectable } from '@nestjs/common';
import { AlertCacheService } from '../service';

@Injectable()
export class AlertUc {
	constructor(private readonly cacheService: AlertCacheService) {}

	public find() {
		return this.cacheService.getMessages();
	}
}

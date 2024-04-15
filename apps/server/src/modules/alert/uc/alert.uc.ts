import { Injectable } from '@nestjs/common';
import { CacheService } from '../service';

@Injectable()
export class AlertUc {
	constructor(private readonly cacheService: CacheService) {}

	public find() {
		return this.cacheService.getMessages();
	}
}

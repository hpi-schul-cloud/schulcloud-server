import { Logger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { NewsRepo } from '../../repo';

@Injectable()
export class NewsService {
	constructor(private readonly newsRepo: NewsRepo, private readonly logger: Logger) {
		this.logger.setContext(NewsService.name);
	}

	// TODO add service methods and refactor UC to use them
}

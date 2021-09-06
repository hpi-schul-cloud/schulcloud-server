import { Controller, Post } from '@nestjs/common';
import { Logger } from '../../../core/logger/logger.service';
import { MongoConsoleService } from './mongo-console.service';

@Controller('mongo-console')
export class MongoConsoleController {
	private logger: Logger;

	constructor(private mongoConsole: MongoConsoleService) {
		this.logger = new Logger(MongoConsoleController.name, true);
		this.logger.error('Do not publish Mongo Console Controller via REST in production!');
	}

	@Post('drop')
	async dropCollections(): Promise<string[]> {
		const collectionNamesDropped = this.mongoConsole.dropCollections();
		return collectionNamesDropped;
	}
}

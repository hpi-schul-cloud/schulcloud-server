import { Injectable } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Logger } from '../../../core/logger/logger.service';

@Injectable()
export class MongoMemoryDatabaseProvider {
	constructor(private mongod: MongoMemoryServer, protected logger: Logger) {
		this.logger.setContext(MongoMemoryDatabaseProvider.name);
	}

	// todo separate create?

	async getUri(otherDbName?: string | boolean): Promise<string> {
		const uri = await this.mongod.getUri(otherDbName);
		this.logger.log(`resolve with a new mongo uri: ${uri}`);
		return uri;
	}

	async close(): Promise<void> {
		await this.mongod.stop();
	}

	async onApplicationShutdown(): Promise<void> {
		await this.close();
	}
}

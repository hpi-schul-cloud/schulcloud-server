/* eslint-disable no-restricted-syntax */
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';
import { Logger } from '../../../core/logger/logger.service';

interface ICollection {
	name: string;
}

@Injectable()
export class MongoConsoleService {
	private logger: Logger;

	constructor(private em: EntityManager) {
		this.logger = new Logger(MongoConsoleService.name, true);
	}

	/**
	 * Drops all collections of the mongo drivers database connection.
	 * Hint: The originated MongoDriver.dropCollections() would only remove collections of registered entities.
	 */
	async dropCollections(): Promise<string[]> {
		const driver = this.em.getDriver();
		const db = driver.getConnection('write').getDb();
		const collections = ((await db.listCollections().toArray()) || []) as ICollection[];
		const collectionNames = collections.map((collection) => collection.name);
		for (const collection of collectionNames) {
			this.logger.log(`drop collection: ${collection}`);
			// eslint-disable-next-line no-await-in-loop
			await driver.getConnection('write').dropCollection(collection);
			this.logger.log(`collection dropped: ${collection}`);
		}
		return collectionNames;
	}
}

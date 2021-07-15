/* istanbul ignore file */
// TODO add spec when this will be really used
import { MongoDriver } from '@mikro-orm/mongodb';
import { MongoSharedConnection } from './mongo-shared-connection';

export class MongoSharedDriver extends MongoDriver {
	protected readonly connection = new MongoSharedConnection(this.config);
}

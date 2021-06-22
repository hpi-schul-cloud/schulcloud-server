/* istanbul ignore file */
// TODO add spec when this will be really used
import { MongoConnection } from '@mikro-orm/mongodb';
import { MongoClient } from 'mongodb';

// the shared mongo client
let sharedClient: MongoClient | undefined;

// keep a list of references to all open mikro-orm mongo connections
const connections: Array<MongoSharedConnection> = [];

export class MongoSharedConnection extends MongoConnection {
	async connect(): Promise<void> {
		if (!sharedClient) {
			sharedClient = await MongoClient.connect(this.config.getClientUrl(), this.getConnectionOptions());
		}
		connections.push(this);
		this.client = sharedClient;
		this.db = this.client.db(this.config.get('dbName'));
	}

	async close(force?: boolean): Promise<void> {
		// remove from list of references
		connections.splice(connections.indexOf(this), 1);
		if (connections.length === 0) {
			// close client when there are no more references
			await sharedClient?.close(force);
			sharedClient = undefined;
		}
	}
}

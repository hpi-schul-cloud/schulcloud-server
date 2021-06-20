import { MongoConnection } from '@mikro-orm/mongodb';
import { MongoClient } from 'mongodb';

let client: MongoClient | null = null;

export class MongoSharedConnection extends MongoConnection {
	async connect(): Promise<void> {
		if (client == null) {
			client = await MongoClient.connect(this.config.getClientUrl(), this.getConnectionOptions());
		}
		this.client = client;
		this.db = this.client.db(this.config.get('dbName'));
	}

	async close(force?: boolean): Promise<void> {
		if (client) {
			await client?.close(force);
			client = null;
		}
	}
}

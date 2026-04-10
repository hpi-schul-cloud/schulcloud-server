import { InternalDatabaseConfig } from '@infra/database';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/mongo-adapter';
import { MongoClient } from 'mongodb';
import { Server, ServerOptions } from 'socket.io';

const COLLECTION_NAME = 'socketio-adapter-events';

export class MongoIoAdapter extends IoAdapter {
	private adapterConstructor: ReturnType<typeof createAdapter> | undefined = undefined;

	public async connectToMongoDb(dbConfig: InternalDatabaseConfig): Promise<void> {
		const mongoClient = new MongoClient(dbConfig.dbUrl);
		await mongoClient.connect();

		const mongoCollection = mongoClient.db().collection(COLLECTION_NAME);
		await mongoCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600, background: true });

		this.adapterConstructor = createAdapter(mongoCollection, {
			addCreatedAtField: true,
		});
	}

	public createIOServer(port: number, options?: ServerOptions): Server {
		// istanbul ignore next
		if (!this.adapterConstructor) {
			throw new Error('MongoIOAdapter is not connected to MongoDB yet.');
		}
		const server = super.createIOServer(port, options) as Server;
		server.adapter(this.adapterConstructor);
		return server;
	}
}

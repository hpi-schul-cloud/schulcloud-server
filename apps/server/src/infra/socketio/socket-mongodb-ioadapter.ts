import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions, Server } from 'socket.io';
import { createAdapter } from '@socket.io/mongo-adapter';
import { MongoClient } from 'mongodb';

export class MongoIoAdapter extends IoAdapter {
	private adapterConstructor: ReturnType<typeof createAdapter> | undefined = undefined;

	async connectToMongoDb(connectionString?: string): Promise<void> {
		const COLLECTION = 'socket.io-adapter-events';

		const mongoClient = new MongoClient(connectionString || 'mongodb://mongo-svc:27017/scapp?directConnection=true');

		await mongoClient.connect();

		const mongoCollection = mongoClient.db().collection(COLLECTION);

		await mongoCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600, background: true });

		this.adapterConstructor = createAdapter(mongoCollection, {
			addCreatedAtField: true,
		});
	}

	createIOServer(port: number, options?: ServerOptions): Server {
		// istanbul ignore next
		if (!this.adapterConstructor) {
			throw new Error('MongoIOAdapter is not connected to MongoDB yet.');
		}
		const server = super.createIOServer(port, options) as Server;
		server.adapter(this.adapterConstructor);
		return server;
	}
}

import { Configuration } from '@hpi-schul-cloud/commons';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions, Server } from 'socket.io';
import { createAdapter } from '@socket.io/mongo-adapter';
import { MongoClient } from 'mongodb';

const COLLECTION_NAME = 'socketio-adapter-events';

export class MongoIoAdapter extends IoAdapter {
	private adapterConstructor: ReturnType<typeof createAdapter> | undefined = undefined;

	public async connectToMongoDb(): Promise<void> {
		const connectionString = Configuration.has('DB_URL') ? (Configuration.get('DB_URL') as string) : '';
		const mongoClient = new MongoClient(connectionString);
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

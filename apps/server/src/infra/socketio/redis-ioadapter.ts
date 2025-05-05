/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Configuration } from '@hpi-schul-cloud/commons';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'iovalkey';
import { Server, ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
	private adapterConstructor: ReturnType<typeof createAdapter> | undefined = undefined;

	public connectToRedis(): void {
		const redisUri = Configuration.has('SESSION_VALKEY__URI')
			? (Configuration.get('SESSION_VALKEY__URI') as string)
			: 'localhost:6379';
		const pubClient = new Redis(redisUri);
		const subClient = new Redis(redisUri);

		pubClient.on('error', (err) => {
			// istanbul ignore next
			process.stdout.write(`pubClient error: ${err.message}`);
		});

		subClient.on('error', (err) => {
			// istanbul ignore next
			process.stdout.write(`subClient error: ${err.message}`);
		});

		this.adapterConstructor = createAdapter(pubClient, subClient);
	}

	public createIOServer(port: number, options?: ServerOptions): Server {
		this.connectToRedis();
		// istanbul ignore next
		if (!this.adapterConstructor) {
			throw new Error('Redis adapter is not connected to Redis yet.');
		}
		const server = super.createIOServer(port, options) as Server;
		// istanbul ignore next
		if (server === undefined) {
			throw new Error('Unable to create RedisServer');
		}
		server.adapter(this.adapterConstructor);

		return server;
	}
}

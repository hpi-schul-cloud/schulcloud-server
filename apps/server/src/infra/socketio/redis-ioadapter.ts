/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions, Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Configuration } from '@hpi-schul-cloud/commons';
import { Redis } from 'ioredis';

export class RedisIoAdapter extends IoAdapter {
	private adapterConstructor: ReturnType<typeof createAdapter> | undefined = undefined;

	async connectToRedis(): Promise<void> {
		if (Configuration.has('REDIS_URI')) {
			const redisUri = Configuration.get('REDIS_URI') as string;
			const pubClient = new Redis(redisUri);
			const subClient = pubClient.duplicate();

			pubClient.on('error', (err) => {
				console.error('pubClient error', err);
			});
			subClient.on('error', (err) => {
				console.error('subClient error', err);
			});

			await Promise.all([pubClient.connect(), subClient.connect()]);

			this.adapterConstructor = createAdapter(pubClient, subClient);
		}
	}

	createIOServer(port: number, options?: ServerOptions): Server {
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

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Redis } from 'ioredis';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Configuration } from '@hpi-schul-cloud/commons';

export class RedisIoAdapter extends IoAdapter {
	connectToRedis(): ReturnType<typeof createAdapter> {
		const redisUri = Configuration.get('REDIS_URI') ?? 'http://localhost:6379';
		const pubClient = new Redis(redisUri as string);
		const subClient = pubClient.duplicate();

		pubClient.on('error', (err) => {
			console.error('pubClient error', err);
		});
		subClient.on('error', (err) => {
			console.error('subClient error', err);
		});

		const adapterConstructor = createAdapter(pubClient, subClient);
		return adapterConstructor as ReturnType<typeof createAdapter>;
	}

	createIOServer(port: number, options?: ServerOptions): IoAdapter {
		const adapterConstructor = this.connectToRedis();
		if (adapterConstructor === undefined) throw new Error('Redis adapter is not connected to Redis yet.');
		const server = super.createIOServer(port, {
			transports: ['websocket'],
			...options,
		});
		if (server === undefined) {
			throw new Error('Unable to create RedisServer');
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		server.adapter(adapterConstructor);
		return server as IoAdapter;
	}
}

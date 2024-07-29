/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Redis } from 'ioredis';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

export class RedisIoAdapter extends IoAdapter {
	connectToRedis(): ReturnType<typeof createAdapter> {
		const pubClient = new Redis();
		const subClient = pubClient.duplicate();
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

import Redis from 'ioredis';
import { WsSharedDocDo } from '@modules/tldraw/domain/ws-shared-doc.do';

export const getDocUpdatesKey = (doc: WsSharedDocDo) => `doc:${doc.name}:updates`;

export const getDocUpdatesFromQueue = async (redis: Redis.Redis, doc: WsSharedDocDo) =>
	redis.lrangeBuffer(getDocUpdatesKey(doc), 0, -1);

export const pushDocUpdatesToQueue = async (redis: Redis.Redis, doc: WsSharedDocDo, update: Uint8Array) => {
	console.log('Entered pushDocUpdatesToQueue');
	const len = await redis.llen(getDocUpdatesKey(doc));
	console.log('pushDocUpdatesToQueue len: ', len);
	if (len > 100) {
		void redis
			.pipeline()
			.lpopBuffer(getDocUpdatesKey(doc))
			.rpushBuffer(getDocUpdatesKey(doc), Buffer.from(update))
			.expire(getDocUpdatesKey(doc), 300)
			.exec();
		console.log('pushDocUpdatesToQueue len > 100 after exec');
	} else {
		await redis
			.pipeline()
			.rpushBuffer(getDocUpdatesKey(doc), Buffer.from(update))
			.expire(getDocUpdatesKey(doc), 300)
			.exec();
		console.log('pushDocUpdatesToQueue len <= 100 after exec');
	}
};

import { config } from '../config';

export const tldrawTestConfig = () => {
	const conf = config();
	if (!conf.REDIS_URI) {
		conf.REDIS_URI = 'redis://127.0.0.1:6379';
	}
	conf.TLDRAW_DB_COMPRESS_THRESHOLD = 2;
	conf.TLDRAW_PING_TIMEOUT = 0;
	conf.TLDRAW_FINALIZE_DELAY = 0;
	conf.TLDRAW_MAX_DOCUMENT_SIZE = 1;
	return conf;
};

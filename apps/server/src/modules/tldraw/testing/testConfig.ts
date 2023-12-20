import { config } from '../config';

export const tldrawTestConfig = () => {
	const conf = config();
	if (!conf.REDIS_URI) {
		conf.REDIS_URI = 'redis://127.0.0.1:6379';
	}
	conf.TLDRAW_DB_FLUSH_SIZE = 2;
	return conf;
};

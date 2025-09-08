import { UrlConfiguration } from '../types';

export const getUrlConfiguration = (target?: string): UrlConfiguration => {
	if (target === undefined || /localhost/.test(target)) {
		return {
			websocket: 'http://localhost:4450',
			api: 'http://localhost:3030',
			web: 'http://localhost:4000',
		};
	}
	return {
		websocket: target,
		api: target,
		web: target,
	};
};

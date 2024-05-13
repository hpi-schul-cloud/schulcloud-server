import { Configuration } from '@hpi-schul-cloud/commons/lib';

const host = Configuration.get('HOST') as string;
const isLocalhost = host.includes('localhost');
const origin = isLocalhost ? 'http://localhost:4000' : host;

export default class BoardCollaborationConfiguration {
	static websocket = {
		path: '/board-collaboration',
		cors: {
			origin,
			methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
			preflightContinue: false,
			optionsSuccessStatus: 204,
			credentials: true,
		},
	};
}

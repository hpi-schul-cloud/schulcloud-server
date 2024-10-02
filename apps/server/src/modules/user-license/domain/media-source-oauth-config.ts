import { MediaSourceAuthMethod } from '../enum';

export class MediaSourceOauthConfig {
	clientId: string;

	clientSecret: string;

	authEndpoint: string;

	method: MediaSourceAuthMethod;

	constructor(props: MediaSourceOauthConfig) {
		this.clientId = props.clientId;
		this.clientSecret = props.clientSecret;
		this.authEndpoint = props.authEndpoint;
		this.method = props.method;
	}
}

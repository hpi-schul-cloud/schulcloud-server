import { MediaSourceAuthMethod } from '../enum';

export class MediaSourceOauthConfig {
	public clientId: string;

	public clientSecret: string;

	public authEndpoint: string;

	public method: MediaSourceAuthMethod;

	public baseUrl: string;

	constructor(props: MediaSourceOauthConfig) {
		this.clientId = props.clientId;
		this.clientSecret = props.clientSecret;
		this.authEndpoint = props.authEndpoint;
		this.method = props.method;
		this.baseUrl = props.baseUrl;
	}
}

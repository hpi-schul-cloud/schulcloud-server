import { Embeddable, Enum, Property } from '@mikro-orm/core';
import { MediaSourceAuthMethod } from '../enum';

@Embeddable()
export class MediaSourceOauthConfigEmbeddable {
	@Property()
	public clientId: string;

	@Property()
	public clientSecret: string;

	@Property()
	public authEndpoint: string;

	@Enum({ nullable: false })
	public method: MediaSourceAuthMethod;

	@Property()
	public baseUrl: string;

	constructor(props: MediaSourceOauthConfigEmbeddable) {
		this.clientId = props.clientId;
		this.clientSecret = props.clientSecret;
		this.authEndpoint = props.authEndpoint;
		this.method = props.method;
		this.baseUrl = props.baseUrl;
	}
}

import { Embeddable, Enum, Property } from '@mikro-orm/core';
import { MediaSourceAuthMethod } from '../enum';

@Embeddable()
export class MediaSourceOauthConfigEmbeddable {
	@Property()
	clientId: string;

	@Property()
	clientSecret: string;

	@Property()
	authEndpoint: string;

	@Enum({ nullable: false })
	method: MediaSourceAuthMethod;

	@Property()
	baseUrl: string;

	constructor(props: MediaSourceOauthConfigEmbeddable) {
		this.clientId = props.clientId;
		this.clientSecret = props.clientSecret;
		this.authEndpoint = props.authEndpoint;
		this.method = props.method;
		this.baseUrl = props.baseUrl;
	}
}

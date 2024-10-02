import { Embeddable, Enum, Property } from '@mikro-orm/core';
import { MediaSourceAuthMethod } from '../enum/media-source-auth-method.enum';

export interface MediaSourceConfigEmbeddableProps {
	clientId: string;

	clientSecret: string;

	authEndpoint: string;

	method: MediaSourceAuthMethod;
}

@Embeddable()
export class MediaSourceConfigEmbeddable {
	@Property()
	clientId: string;

	@Property()
	clientSecret: string;

	@Property()
	authEndpoint: string;

	@Enum({ nullable: false })
	method: MediaSourceAuthMethod;

	constructor(props: MediaSourceConfigEmbeddableProps) {
		this.clientId = props.clientId;
		this.clientSecret = props.clientSecret;
		this.authEndpoint = props.authEndpoint;
		this.method = props.method;
	}
}

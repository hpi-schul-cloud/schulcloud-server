import { Embeddable, Property } from '@mikro-orm/core';

@Embeddable()
export class MediaSourceBasicAuthConfigEmbeddable {
	@Property()
	public username: string;

	@Property()
	public password: string;

	@Property()
	public authEndpoint: string;

	constructor(props: MediaSourceBasicAuthConfigEmbeddable) {
		this.username = props.username;
		this.password = props.password;
		this.authEndpoint = props.authEndpoint;
	}
}

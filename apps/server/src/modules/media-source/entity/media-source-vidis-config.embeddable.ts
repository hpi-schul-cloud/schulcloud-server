import { Embeddable, Property } from '@mikro-orm/core';

@Embeddable()
export class MediaSourceVidisConfigEmbeddable {
	@Property()
	public username: string;

	@Property()
	public password: string;

	@Property()
	public baseUrl: string;

	@Property()
	public region: string;

	@Property()
	public schoolNumberPrefix: string;

	constructor(props: MediaSourceVidisConfigEmbeddable) {
		this.username = props.username;
		this.password = props.password;
		this.baseUrl = props.baseUrl;
		this.region = props.region;
		this.schoolNumberPrefix = props.schoolNumberPrefix;
	}
}

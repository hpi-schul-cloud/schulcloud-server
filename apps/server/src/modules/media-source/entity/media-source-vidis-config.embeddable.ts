import { Embeddable, Property } from '@mikro-orm/core';

@Embeddable()
export class MediaSourceVidisConfigEmbeddable {
	@Property()
	username: string;

	@Property()
	password: string;

	@Property()
	baseUrl: string;

	@Property()
	region: string;

	@Property()
	schoolNumberPrefix: string;

	constructor(props: MediaSourceVidisConfigEmbeddable) {
		this.username = props.username;
		this.password = props.password;
		this.baseUrl = props.baseUrl;
		this.region = props.region;
		this.schoolNumberPrefix = props.schoolNumberPrefix;
	}
}

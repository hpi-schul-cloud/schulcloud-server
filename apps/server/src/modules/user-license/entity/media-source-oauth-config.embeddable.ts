import { Embeddable, Enum, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { MediaSourceAuthMethod } from '../enum/media-source-auth-method.enum';

export interface MediaSourceConfigEmbeddableProps {
	_id: ObjectId;

	clientId: string;

	clientSecret: string;

	authEndpoint: string;

	method: MediaSourceAuthMethod;
}

@Embeddable()
export class MediaSourceConfigEmbeddable {
	@Property()
	_id: ObjectId;

	@Property()
	clientId: string;

	@Property()
	clientSecret: string;

	@Property()
	authEndpoint: string;

	@Enum({ nullable: false })
	method: MediaSourceAuthMethod;

	constructor(props: MediaSourceConfigEmbeddableProps) {
		this._id = props._id;
		this.clientId = props.clientId;
		this.clientSecret = props.clientSecret;
		this.authEndpoint = props.authEndpoint;
		this.method = props.method;
	}
}

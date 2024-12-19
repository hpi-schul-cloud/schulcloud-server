import { Embeddable, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

export interface MediaSourceBasicAuthConfigEmbeddableProps {
	_id: ObjectId;

	username: string;

	password: string;

	authEndpoint: string;
}

@Embeddable()
export class MediaSourceBasicAuthConfigEmbeddable {
	@Property()
	_id: ObjectId;

	@Property()
	username: string;

	@Property()
	password: string;

	@Property()
	authEndpoint: string;

	constructor(props: MediaSourceBasicAuthConfigEmbeddableProps) {
		this._id = props._id;
		this.username = props.username;
		this.password = props.password;
		this.authEndpoint = props.authEndpoint;
	}
}

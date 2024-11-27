import { Embeddable, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

export interface MediaSourceBasicConfigEmbeddableProps {
	_id: ObjectId;

	username: string;

	password: string;

	authEndpoint: string;
}

@Embeddable()
export class MediaSourceBasicConfigEmbeddable {
	@Property()
	_id: ObjectId;

	@Property()
	username: string;

	@Property()
	password: string;

	@Property()
	authEndpoint: string;

	constructor(props: MediaSourceBasicConfigEmbeddableProps) {
		this._id = props._id;
		this.username = props.username;
		this.password = props.password;
		this.authEndpoint = props.authEndpoint;
	}
}

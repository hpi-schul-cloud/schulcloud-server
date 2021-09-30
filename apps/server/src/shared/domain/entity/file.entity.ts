/* istanbul ignore file */
// TODO add tests to improve coverage

import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import type { User } from './user.entity';

interface IFileProperties {
	name: string;
	creator: User;
}

@Entity({ tableName: 'files' })
export class File extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Property()
	creator: User;

	constructor(props: IFileProperties) {
		super();
		this.name = props.name;
		this.creator = props.creator;
		Object.assign(this, {});
	}
}

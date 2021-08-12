import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '@shared/domain';

interface IUserTaskInfoProperties {
	firstName: string;
	lastName: string;
}

@Entity({ tableName: 'users' })
export class UserTaskInfo extends BaseEntity {
	@Property()
	firstName!: string;

	@Property()
	lastName!: string;

	constructor(props: IUserTaskInfoProperties) {
		super();
		this.firstName = props.firstName;
		this.lastName = props.lastName;

		Object.assign(this, {});
	}
}

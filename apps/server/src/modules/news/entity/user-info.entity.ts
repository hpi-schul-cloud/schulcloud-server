import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../../shared/domain';

@Entity({ tableName: 'users' })
export class UserInfo extends BaseEntity {
	@Property()
	firstName!: string;

	@Property()
	lastName!: string;

	constructor(props: { firstName: string; lastName: string }) {
		super();
		this.firstName = props.firstName;
		this.lastName = props.lastName;
	}
}

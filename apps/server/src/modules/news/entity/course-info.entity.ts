import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '@shared/domain';

@Entity({ tableName: 'courses' })
export class CourseInfo extends BaseEntity {
	@Property()
	name!: string;

	constructor(props: { name: string }) {
		super();
		this.name = props.name;
	}
}

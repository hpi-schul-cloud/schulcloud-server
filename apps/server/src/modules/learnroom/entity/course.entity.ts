import { Entity, Property, Index } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';

enum CourseFeatures {
	MESSENGER = 'messenger',
}

const DEFAULT_COLOR = '#ACACAC';

export interface ICourseProperties {
	name: string;
	description?: string;
	schoolId: EntityId;
	classIds?: EntityId[];
	teacherIds?: EntityId[];
	substitutionIds?: EntityId[];
	userIds?: EntityId[];
	// TODO: color format
	color?: string;
	features?: CourseFeatures[];
}

@Entity({ tableName: 'courses' })
export class Course extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Property()
	description?: string;

	@Index()
	@Property()
	schoolId: EntityId;

	@Index()
	@Property()
	classIds: EntityId[];

	@Index()
	@Property()
	userIds: EntityId[];

	@Index()
	@Property()
	teacherIds: EntityId[];

	@Index()
	@Property()
	substitutionIds?: EntityId[];

	// TODO: string color format
	@Property()
	color: string;

	@Property()
	features: CourseFeatures[];

	constructor(props: ICourseProperties) {
		super();
		this.name = props.name;
		this.description = props.description || '';
		this.schoolId = props.schoolId;
		this.classIds = props.classIds || [];
		this.userIds = props.userIds || [];
		this.teacherIds = props.teacherIds || [];
		this.substitutionIds = props.substitutionIds || [];
		this.color = props.color || DEFAULT_COLOR;
		this.features = props.features || [];
		Object.assign(this, {});
	}
}

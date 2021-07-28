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
	substitutionTeacherIds?: EntityId[];
	studentIds?: EntityId[];
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
	@Property({ fieldName: 'userIds' })
	studentIds: EntityId[];

	@Index()
	@Property()
	teacherIds: EntityId[];

	@Index()
	@Property({ fieldName: 'substitutionIds' })
	substitutionTeacherIds?: EntityId[];

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
		this.studentIds = props.studentIds || [];
		this.teacherIds = props.teacherIds || [];
		this.substitutionTeacherIds = props.substitutionTeacherIds || [];
		this.color = props.color || DEFAULT_COLOR;
		this.features = props.features || [];
		Object.assign(this, {});
	}
}

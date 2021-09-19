import { Entity, Property, Index } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';

interface ICourseProperties {
	name?: string;
	description?: string;
	schoolId: ObjectId;
	teacherIds?: ObjectId[];
	substitutionTeacherIds?: ObjectId[];
	studentIds?: ObjectId[];
	// TODO: color format
	color?: string;
}

// that is really really shit default handling :D constructor, getter, js default, em default...what the hell
// i hope it can cleanup with adding schema instant of I...Properties.
const DEFAULT = {
	color: '#ACACAC',
	name: 'Kurse',
	description: '',
};

@Entity({ tableName: 'courses' })
export class Course extends BaseEntityWithTimestamps {
	@Property({ default: DEFAULT.name })
	name: string = DEFAULT.name;

	@Property({ default: DEFAULT.description })
	description: string = DEFAULT.description;

	@Index()
	@Property()
	schoolId: ObjectId;

	@Index()
	@Property({ fieldName: 'userIds' })
	studentIds: ObjectId[] = [];

	@Index()
	@Property()
	teacherIds: ObjectId[] = [];

	@Index()
	@Property({ fieldName: 'substitutionIds' })
	substitutionTeacherIds: ObjectId[] = [];

	// TODO: string color format
	@Property({ default: DEFAULT.color })
	color: string = DEFAULT.color;

	constructor(props: ICourseProperties) {
		super();
		this.name = props.name || DEFAULT.name;
		this.description = props.description || DEFAULT.description;
		this.schoolId = props.schoolId;
		this.studentIds = props.studentIds || [];
		this.teacherIds = props.teacherIds || [];
		this.substitutionTeacherIds = props.substitutionTeacherIds || [];
		this.color = props.color || DEFAULT.color;

		Object.assign(this, {});
	}

	getNumberOfStudents(): number {
		// TODO remove "|| []" when we can rely on db schema integrity
		return (this.studentIds || []).length;
	}

	getDescriptions(): { color: string; id: EntityId; name: string; description: string } {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			color: this.color,
		};
	}
}

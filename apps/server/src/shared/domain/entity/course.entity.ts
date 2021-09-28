import { Entity, Property, Index, ManyToOne, ManyToMany, Collection } from '@mikro-orm/core';
import { EntityId } from '../types/entity-id';
import { BaseEntityWithTimestamps } from './base.entity';
import type { School } from './school.entity';
import type { User } from './user.entity';

interface ICourseProperties {
	name?: string;
	description?: string;
	school: School;
	students?: User[];
	teachers?: User[];
	substitutionTeachers?: User[];
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
	@ManyToOne('School', { fieldName: 'schoolId' })
	school!: School;

	@Index()
	@ManyToMany('User', undefined, { fieldName: 'userIds' })
	students = new Collection<User>(this);

	@Index()
	@ManyToMany('User', undefined, { fieldName: 'teacherIds' })
	teachers = new Collection<User>(this);

	@Index()
	@ManyToMany('User', undefined, { fieldName: 'substitutionIds' })
	substitutionTeachers = new Collection<User>(this);

	// TODO: string color format
	@Property({ default: DEFAULT.color })
	color: string = DEFAULT.color;

	constructor(props: ICourseProperties) {
		super();
		if (props.name) this.name = props.name;
		if (props.description) this.description = props.description;
		this.school = props.school;
		if (props.students) this.students.set(props.students);
		if (props.teachers) this.teachers.set(props.teachers);
		if (props.substitutionTeachers) this.substitutionTeachers.set(props.substitutionTeachers);
		if (props.color) this.color = props.color;
	}

	getNumberOfStudents(): number {
		return this.students.length;
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

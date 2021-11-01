import { Entity, Property, Index, ManyToOne, ManyToMany, Collection } from '@mikro-orm/core';

import { EntityId } from '../types';

import { BaseEntityWithTimestamps } from './base.entity';
import type { School } from './school.entity';
import type { User } from './user.entity';

export interface ICourseProperties {
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

@Index({ name: 'findAllForTeacher', properties: ['substitutionTeachers', 'teachers'] })
@Entity({ tableName: 'courses' })
export class Course extends BaseEntityWithTimestamps {
	@Property()
	name: string = DEFAULT.name;

	@Property()
	description: string = DEFAULT.description;

	@ManyToOne('School', { fieldName: 'schoolId' })
	school!: School;

	@Index({ name: 'findAllForStudent' })
	@ManyToMany('User', undefined, { fieldName: 'userIds' })
	students = new Collection<User>(this);

	@ManyToMany('User', undefined, { fieldName: 'teacherIds' })
	teachers = new Collection<User>(this);

	@ManyToMany('User', undefined, { fieldName: 'substitutionIds' })
	substitutionTeachers = new Collection<User>(this);

	// TODO: string color format
	@Property()
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

	getSubstitutionTeacherIds(): EntityId[] {
		const substitutionIds = this.substitutionTeachers.getIdentifiers('id');
		// The result of getIdentifiers is a primary key type where we have no represent for it ((string | ObjectId) & IPrimaryKeyValue)[]
		return substitutionIds.filter((id) => id).map((id) => id.toString());
	}
}

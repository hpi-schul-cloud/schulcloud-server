import { Collection, Entity, Index, ManyToMany, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { IEntityWithSchool, ILearnroom } from '@shared/domain/interface';
import { LearnroomMetadata, LearnroomTypes } from '../types';
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
	startDate?: Date;
	untilDate?: Date;
}

// that is really really shit default handling :D constructor, getter, js default, em default...what the hell
// i hope it can cleanup with adding schema instant of I...Properties.
const DEFAULT = {
	color: '#ACACAC',
	name: 'Kurse',
	description: '',
};

@Entity({ tableName: 'courses' })
export class Course extends BaseEntityWithTimestamps implements ILearnroom, IEntityWithSchool {
	@Property()
	name: string = DEFAULT.name;

	@Property()
	description: string = DEFAULT.description;

	@Index()
	@ManyToOne('School', { fieldName: 'schoolId' })
	school: School;

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
	@Property()
	color: string = DEFAULT.color;

	@Property({ nullable: true })
	startDate?: Date;

	@Index()
	@Property({ nullable: true })
	untilDate?: Date;

	@Property({ nullable: true })
	@Unique({ options: { sparse: true } })
	shareToken?: string;

	constructor(props: ICourseProperties) {
		super();
		if (props.name) this.name = props.name;
		if (props.description) this.description = props.description;
		this.school = props.school;
		this.students.set(props.students || []);
		this.teachers.set(props.teachers || []);
		this.substitutionTeachers.set(props.substitutionTeachers || []);
		if (props.color) this.color = props.color;
		if (props.untilDate) this.untilDate = props.untilDate;
		if (props.startDate) this.startDate = props.startDate;
	}

	getNumberOfStudents(): number {
		return this.students.length;
	}

	isFinished(): boolean {
		if (!this.untilDate) {
			return false;
		}
		const isFinished = this.untilDate < new Date();

		return isFinished;
	}

	getMetadata(): LearnroomMetadata {
		return {
			id: this.id,
			type: LearnroomTypes.Course,
			title: this.name,
			shortTitle: this.getShortTitle(),
			displayColor: this.color,
			untilDate: this.untilDate,
			startDate: this.startDate,
		};
	}

	private getShortTitle(): string {
		if (this.name.length === 1) {
			return this.name;
		}
		const [firstChar, secondChar] = [...this.name];
		const pattern = /\p{Extended_Pictographic}/u;
		if (pattern.test(firstChar)) {
			return firstChar;
		}
		return firstChar + secondChar;
	}
}

import {
	Entity,
	Property,
	Index,
	ManyToOne,
	ManyToMany,
	Collection,
	OneToOne,
	IdentifiedReference,
	wrap,
} from '@mikro-orm/core';

import { ILearnroom } from '@shared/domain/interface';
import { LearnroomMetadata, LearnroomTypes } from '../types';

import { BaseEntityWithTimestamps } from './base.entity';
import type { School } from './school.entity';
import type { User } from './user.entity';
import { Board } from './board.entity';

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
	primaryBoard?: Board;
}

// that is really really shit default handling :D constructor, getter, js default, em default...what the hell
// i hope it can cleanup with adding schema instant of I...Properties.
const DEFAULT = {
	color: '#ACACAC',
	name: 'Kurse',
	description: '',
};

@Index({ name: 'findAllForTeacher', properties: ['substitutionTeachers', 'teachers'] })
@Index({ name: 'findAllByUserId', properties: ['students', 'substitutionTeachers', 'teachers'] })
@Entity({ tableName: 'courses' })
export class Course extends BaseEntityWithTimestamps implements ILearnroom {
	@Property()
	name: string = DEFAULT.name;

	@Property()
	description: string = DEFAULT.description;

	@ManyToOne('School', { fieldName: 'schoolId' })
	school!: School;

	@ManyToMany('User', undefined, { fieldName: 'userIds' })
	students = new Collection<User>(this);

	@ManyToMany('User', undefined, { fieldName: 'teacherIds' })
	teachers = new Collection<User>(this);

	@ManyToMany('User', undefined, { fieldName: 'substitutionIds' })
	substitutionTeachers = new Collection<User>(this);

	// TODO: string color format
	@Property()
	color: string = DEFAULT.color;

	@Property()
	startDate?: Date;

	@OneToOne('Board', undefined, { wrappedReference: true })
	primaryBoard: IdentifiedReference<Board>;

	@Index({ name: 'activeCourses' })
	@Property()
	untilDate?: Date;

	constructor(props: ICourseProperties) {
		super();
		if (props.name) this.name = props.name;
		if (props.description) this.description = props.description;
		this.school = props.school;
		if (props.students) this.students.set(props.students);
		if (props.teachers) this.teachers.set(props.teachers);
		if (props.substitutionTeachers) this.substitutionTeachers.set(props.substitutionTeachers);
		if (props.color) this.color = props.color;
		if (props.untilDate) this.untilDate = props.untilDate;
		if (props.startDate) this.startDate = props.startDate;
		const board = props.primaryBoard || new Board({ references: [] });
		this.primaryBoard = wrap(board).toReference();
	}

	async getBoard(): Promise<Board> {
		const board = await this.primaryBoard.load();
		return board;
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
			shortTitle: this.name.substr(0, 2),
			displayColor: this.color,
			untilDate: this.untilDate,
			startDate: this.startDate,
		};
	}
}

import { Collection, Entity, Index, ManyToMany, ManyToOne, OneToMany, Property, Unique } from '@mikro-orm/core';
import { InternalServerErrorException } from '@nestjs/common/exceptions/internal-server-error.exception';
import { IEntityWithSchool, ILearnroom } from '@shared/domain/interface';
import { EntityId, LearnroomMetadata, LearnroomTypes } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import { CourseGroup } from './coursegroup.entity';
import type { ILessonParent } from './lesson.entity';
import type { School } from './school.entity';
import type { ITaskParent } from './task.entity';
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
export class Course
	extends BaseEntityWithTimestamps
	implements ILearnroom, IEntityWithSchool, ITaskParent, ILessonParent
{
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

	@OneToMany('CourseGroup', 'course', { orphanRemoval: true })
	courseGroups = new Collection<CourseGroup>(this);

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

	public getStudentIds(): EntityId[] {
		if (!this.students) {
			throw new InternalServerErrorException('Course.students is undefined. The course need to be populated.');
		}

		const studentObjectIds = this.students.getIdentifiers('_id');
		const studentIds = studentObjectIds.map((id): string => id.toString());

		return studentIds;
	}

	public isUserSubstitutionTeacher(user: User): boolean {
		const isSubstitutionTeacher = this.substitutionTeachers.contains(user);

		return isSubstitutionTeacher;
	}

	public getCourseGroupItems(): CourseGroup[] {
		if (!this.courseGroups.isInitialized(true)) {
			throw new InternalServerErrorException('Courses trying to access their course groups that are not loaded.');
		}
		const courseGroups = this.courseGroups.getItems();

		return courseGroups;
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

	public getMetadata(): LearnroomMetadata {
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

	public isFinished(): boolean {
		if (!this.untilDate) {
			return false;
		}
		const isFinished = this.untilDate < new Date();

		return isFinished;
	}
}

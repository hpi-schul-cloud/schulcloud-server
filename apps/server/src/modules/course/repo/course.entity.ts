import { Collection, Entity, Enum, Index, ManyToMany, ManyToOne, OneToMany, Property, Unique } from '@mikro-orm/core';
import { ClassEntity } from '@modules/class/entity/class.entity';
import { GroupEntity } from '@modules/group/entity/group.entity';
import { LessonParent } from '@modules/lesson/repo';
import { SchoolEntity } from '@modules/school/repo';
import { TaskParent } from '@modules/task/repo';
import { User } from '@modules/user/repo';
import { InternalServerErrorException } from '@nestjs/common/exceptions/internal-server-error.exception';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { CourseSyncAttribute } from '../domain';
// eslint-disable-next-line import/no-cycle
import { CourseGroupEntity } from './coursegroup.entity'; // https://github.com/mikro-orm/mikro-orm/discussions/4089

export enum CourseType {
	'Course' = 'course',
}

export interface CourseMetadata {
	id: string;
	type: CourseType;
	title: string;
	shortTitle: string;
	displayColor: string;
	startDate?: Date;
	untilDate?: Date;
	copyingSince?: Date;
	isSynchronized: boolean;
	isLocked: boolean;
}

export interface CourseProperties {
	name?: string;
	description?: string;
	school: SchoolEntity;
	students?: User[];
	teachers?: User[];
	substitutionTeachers?: User[];
	// TODO: color format
	color?: string;
	startDate?: Date;
	untilDate?: Date;
	copyingSince?: Date;
	features?: CourseFeatures[];
	classes?: ClassEntity[];
	groups?: GroupEntity[];
	syncedWithGroup?: GroupEntity;
	excludeFromSync?: CourseSyncAttribute[];
}

// that is really really shit default handling :D constructor, getter, js default, em default...what the hell
// i hope it can cleanup with adding schema instant of I...Properties.
const DEFAULT = {
	color: '#ACACAC',
	name: 'Kurse',
};

export enum CourseFeatures {
	VIDEOCONFERENCE = 'videoconference',
}

export class UsersList {
	id!: EntityId;

	schoolId!: EntityId;

	firstName!: string;

	lastName!: string;
}

@Entity({ tableName: 'courses' })
export class CourseEntity extends BaseEntityWithTimestamps implements TaskParent, LessonParent {
	@Property()
	name: string;

	@Property({ nullable: true })
	description?: string;

	@Index()
	@ManyToOne(() => SchoolEntity, { fieldName: 'schoolId' })
	school: SchoolEntity;

	@Index()
	@ManyToMany('User', undefined, { fieldName: 'userIds' })
	students = new Collection<User>(this);

	@Index()
	@ManyToMany('User', undefined, { fieldName: 'teacherIds' })
	teachers = new Collection<User>(this);

	@Index()
	@ManyToMany('User', undefined, { fieldName: 'substitutionIds' })
	substitutionTeachers = new Collection<User>(this);

	@OneToMany(() => CourseGroupEntity, 'course', { orphanRemoval: true })
	courseGroups = new Collection<CourseGroupEntity>(this);

	// TODO: string color format
	@Property()
	color: string = DEFAULT.color;

	@Property({ nullable: true })
	startDate?: Date;

	@Index()
	@Property({ nullable: true })
	untilDate?: Date;

	@Property({ nullable: true })
	copyingSince?: Date;

	@Property({ nullable: true })
	@Unique({ options: { sparse: true } })
	shareToken?: string;

	@Enum({ nullable: true, array: true })
	features?: CourseFeatures[];

	@ManyToMany(() => ClassEntity, undefined, { fieldName: 'classIds' })
	classes = new Collection<ClassEntity>(this);

	@ManyToMany(() => GroupEntity, undefined, { fieldName: 'groupIds' })
	groups = new Collection<GroupEntity>(this);

	@ManyToOne(() => GroupEntity, { nullable: true })
	syncedWithGroup?: GroupEntity;

	@Enum({ nullable: true, array: true })
	excludeFromSync?: CourseSyncAttribute[];

	constructor(props: CourseProperties) {
		super();
		this.name = props.name ?? DEFAULT.name;
		if (props.description) this.description = props.description;
		this.school = props.school;
		this.students.set(props.students || []);
		this.teachers.set(props.teachers || []);
		this.substitutionTeachers.set(props.substitutionTeachers || []);
		if (props.color) this.color = props.color;
		if (props.untilDate) this.untilDate = props.untilDate;
		if (props.startDate) this.startDate = props.startDate;
		if (props.copyingSince) this.copyingSince = props.copyingSince;
		if (props.features) this.features = props.features;
		this.classes.set(props.classes || []);
		this.groups.set(props.groups || []);
		if (props.syncedWithGroup) this.syncedWithGroup = props.syncedWithGroup;
		if (props.excludeFromSync) this.excludeFromSync = props.excludeFromSync;
	}

	public getStudentIds(): EntityId[] {
		const studentIds = CourseEntity.extractIds(this.students);
		return studentIds;
	}

	public getTeacherIds(): EntityId[] {
		const teacherIds = CourseEntity.extractIds(this.teachers);
		return teacherIds;
	}

	public getSubstitutionTeacherIds(): EntityId[] {
		const substitutionTeacherIds = CourseEntity.extractIds(this.substitutionTeachers);
		return substitutionTeacherIds;
	}

	private static extractIds(users: Collection<User>): EntityId[] {
		if (!users) {
			throw new InternalServerErrorException(
				`Students, teachers or stubstitution is undefined. The course needs to be populated`
			);
		}

		const objectIds = users.getIdentifiers('_id');
		const ids = objectIds.map((id): string => id.toString());

		return ids;
	}

	public getStudentsList(): UsersList[] {
		const users = this.students.getItems();
		if (users.length) {
			const usersList = CourseEntity.extractUserList(users);
			return usersList;
		}
		return [];
	}

	public getTeachersList(): UsersList[] {
		const users = this.teachers.getItems();
		if (users.length) {
			const usersList = CourseEntity.extractUserList(users);
			return usersList;
		}
		return [];
	}

	public getSubstitutionTeachersList(): UsersList[] {
		const users = this.substitutionTeachers.getItems();
		if (users.length) {
			const usersList = CourseEntity.extractUserList(users);
			return usersList;
		}
		return [];
	}

	private static extractUserList(users: User[]): UsersList[] {
		const usersList: UsersList[] = users.map((user) => {
			return {
				id: user.id,
				schoolId: user.school.id,
				firstName: user.firstName,
				lastName: user.lastName,
			};
		});
		return usersList;
	}

	public isUserSubstitutionTeacher(user: User): boolean {
		const isSubstitutionTeacher = this.substitutionTeachers.contains(user);

		return isSubstitutionTeacher;
	}

	public getCourseGroupItems(): CourseGroupEntity[] {
		if (!this.courseGroups.isInitialized(true)) {
			throw new InternalServerErrorException('Courses trying to access their course groups that are not loaded.');
		}
		const courseGroups = this.courseGroups.getItems();

		return courseGroups;
	}

	public getShortTitle(): string {
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

	public getMetadata(): CourseMetadata {
		return {
			id: this.id,
			type: CourseType.Course,
			title: this.name,
			shortTitle: this.getShortTitle(),
			displayColor: this.color,
			isLocked: this.teachers.length === 0,
			untilDate: this.untilDate,
			startDate: this.startDate,
			copyingSince: this.copyingSince,
			isSynchronized: !!this.syncedWithGroup,
		};
	}

	public isFinished(): boolean {
		if (!this.untilDate) {
			return false;
		}
		const isFinished = this.untilDate < new Date();

		return isFinished;
	}

	public removeUser(userId: EntityId): void {
		this.removeStudent(userId);
		this.removeTeacher(userId);
		this.removeSubstitutionTeacher(userId);
	}

	private removeStudent(userId: EntityId): void {
		this.students.remove((u) => u.id === userId);
	}

	private removeTeacher(userId: EntityId): void {
		this.teachers.remove((u) => u.id === userId);
	}

	private removeSubstitutionTeacher(userId: EntityId): void {
		this.substitutionTeachers.remove((u) => u.id === userId);
	}
}

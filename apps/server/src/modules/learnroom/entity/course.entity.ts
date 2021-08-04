import { Entity, Property, Index } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';
import { Coursegroup } from './coursegroup.entity';

/*
enum CourseFeatures {
	MESSENGER = 'messenger',
}
*/
interface ICourseProperties {
	name: string;
	description?: string;
	schoolId: EntityId;
	// classIds?: EntityId[];
	teacherIds?: EntityId[];
	substitutionTeacherIds?: EntityId[];
	studentIds?: EntityId[];
	// TODO: color format
	color?: string;
	// features?: CourseFeatures[];
}

const DEFAULT = {
	color: '#ACACAC',
	name: 'Kurse',
	description: '',
	groups: [],
};

@Entity({ tableName: 'courses' })
export class Course extends BaseEntityWithTimestamps {
	@Property({ default: DEFAULT.name })
	name!: string;

	@Property({ default: DEFAULT.description })
	description!: string;

	@Index()
	@Property()
	schoolId: EntityId;

	// @Index()
	// @Property()
	// classIds: EntityId[];

	@Index()
	@Property({ fieldName: 'userIds' })
	studentIds: EntityId[];

	@Index()
	@Property()
	teacherIds: EntityId[];

	@Index()
	@Property({ fieldName: 'substitutionIds' })
	substitutionTeacherIds: EntityId[];

	// TODO: string color format
	@Property({ default: DEFAULT.color })
	color!: string;

	@Property({ persist: false, default: DEFAULT.groups })
	private groups: Coursegroup[];

	// @Property()
	// features: CourseFeatures[];

	constructor(props: ICourseProperties) {
		super();
		this.name = props.name || DEFAULT.name;
		this.description = props.description || DEFAULT.description;
		this.schoolId = props.schoolId;
		// this.classIds = props.classIds || [];
		this.studentIds = props.studentIds || [];
		this.teacherIds = props.teacherIds || [];
		this.substitutionTeacherIds = props.substitutionTeacherIds || [];
		this.color = props.color || DEFAULT.color;
		// this.features = props.features || [];

		this.groups = DEFAULT.groups;

		Object.assign(this, {});
	}

	getDescription(): string {
		return this.description || DEFAULT.description;
	}

	changeDescription(description: string): void {
		this.description = description;
	}

	getName(): string {
		return this.name || DEFAULT.name;
	}

	changeName(name: string): void {
		this.name = name;
	}

	getColor(): string {
		return this.color || DEFAULT.color;
	}

	changeColor(color: string): void {
		this.color = color;
	}

	// TODO: the part from this point should handle in a group collection that include an array of user[]

	// isStudent, isTeacher, isSubstitutionTeacher sound like exposing knowlege that should not needed
	// is should not nessasary if the group collection know the details
	private isStudent(userId: EntityId): boolean {
		const isStudent = this.studentIds.includes(userId);
		return isStudent;
	}

	private isTeacher(userId: EntityId): boolean {
		const isTeacher = this.teacherIds.includes(userId);
		return isTeacher;
	}

	private isSubstitutionTeacher(userId: EntityId): boolean {
		const isSubstitutionTeacher = this.substitutionTeacherIds.includes(userId);
		return isSubstitutionTeacher;
	}

	isMember(userId: EntityId): boolean {
		const isMember = this.isStudent(userId) || this.isTeacher(userId) || this.isSubstitutionTeacher(userId);
		return isMember;
	}

	// TODO: temp solution we have nothing that can solve it at the moment
	hasWritePermission(userId: EntityId): boolean {
		const isPrivilegedMember = this.isTeacher(userId) || this.isSubstitutionTeacher(userId);
		return isPrivilegedMember;
	}

	// TODO: populate groups by request course are better for use case, i should look later into it.
	addGroupsThatMatchCourse(coursegroups: Coursegroup[]): void {
		coursegroups.forEach((coursegroup) => {
			if (this.id === coursegroup.getParentId()) {
				this.groups.push(coursegroup);
			}
		});
	}

	getGroups(): Coursegroup[] {
		// TODO: if it is already execute addGroupsThatMatchCourse
		return this.groups;
	}
}

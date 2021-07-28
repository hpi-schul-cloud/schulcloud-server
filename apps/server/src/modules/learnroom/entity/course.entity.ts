import { Entity, Property, Index, EntitySchema } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';

enum CourseFeatures {
	MESSENGER = 'messenger',
}

const DEFAULT_COLOR = '#ACACAC';

export interface ICourseProperties {
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

@Entity({ tableName: 'courses' })
export class Course extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Property()
	description: string;

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
	@Property()
	color: string;

	// @Property()
	// features: CourseFeatures[];

	constructor(props: ICourseProperties) {
		super();
		this.name = props.name || 'Kurse';
		this.description = props.description || '';
		this.schoolId = props.schoolId;
		// this.classIds = props.classIds || [];
		this.studentIds = props.studentIds || [];
		this.teacherIds = props.teacherIds || [];
		this.substitutionTeacherIds = props.substitutionTeacherIds || [];
		this.color = props.color || DEFAULT_COLOR;
		// this.features = props.features || [];
		Object.assign(this, {});
	}

	getDescription(): string {
		return this.description || '';
	}

	getName(): string {
		return this.name || 'Kurse';
	}

	getColor(): string {
		return this.color || DEFAULT_COLOR;
	}

	changeColor(color: string = DEFAULT_COLOR): void {
		this.color = color;
	}

	isStudent(userId: EntityId): boolean {
		const isStudent = this.studentIds.includes(userId);
		return isStudent;
	}

	isTeacher(userId: EntityId): boolean {
		const isTeacher = this.teacherIds.includes(userId);
		return isTeacher;
	}

	isSubstitutionTeacher(userId: EntityId): boolean {
		const isSubstitutionTeacher = this.substitutionTeacherIds.includes(userId);
		return isSubstitutionTeacher;
	}
	/*
	hasReadPermission(userId: EntityId): boolean {
		const hasReadPermission = this.isStudent(userId) || this.isTeacher(userId) || this.isSubstitutionTeacher(userId);
		return hasReadPermission;
	}
	*/
	hasWritePermission(userId: EntityId): boolean {
		const hasWritePermission = this.isTeacher(userId) || this.isSubstitutionTeacher(userId);
		return hasWritePermission;
	}
	*/
}

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
	name: string;

	@Property({ default: DEFAULT.description })
	description: string;

	@Index()
	@Property()
	private schoolId: EntityId;

	// @Index()
	// @Property()
	// classIds: EntityId[];

	@Index()
	@Property({ fieldName: 'userIds', default: [] })
	private studentIds: EntityId[];

	@Index()
	@Property()
	private teacherIds: EntityId[];

	@Index()
	@Property({ fieldName: 'substitutionIds' })
	private substitutionTeacherIds: EntityId[];

	// TODO: string color format
	@Property({ default: DEFAULT.color })
	private color!: string;

	@Property({ persist: false, default: DEFAULT.groups, hidden: true })
	// private groups: Coursegroup[];
	private groups: Coursegroup[] | undefined = undefined;

	// OneToMany()
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

		Object.assign(this, {});
	}

	getStudentsNumber(): number {
		return this.studentIds.length;
	}

	getDescriptions(): { color: string; id: EntityId; name: string; description: string } {
		return {
			id: this.id,
			name: this.name || DEFAULT.name,
			description: this.description || DEFAULT.description,
			color: this.color || DEFAULT.color,
		};
	}

	/**
	 * Important user group operations are only a temporary solution until we have established groups
	 */
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

	/**
	 * Important using hasWritePermissions and isMember as read and write permission interpretation,
	 * is only a temporary solution until we have implement an authorization interface that can used.
	 */
	hasWritePermission(userId: EntityId): boolean {
		const isPrivilegedMember = this.isTeacher(userId) || this.isSubstitutionTeacher(userId);
		return isPrivilegedMember;
	}

	/**
	 * Important it is a bad hack for the moment please do not do it in the same way.
	 */
	setGroupsThatMatchCourse(coursegroups: Coursegroup[]): void {
		const { id } = this;
		const groupsOfCourse = coursegroups.filter((group) => id === group.getParentId());
		this.groups = groupsOfCourse;
	}

	getGroups(): Coursegroup[] | undefined {
		// TODO: if it is already execute addGroupsThatMatchCourse
		return this.groups;
	}
}

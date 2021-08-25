import { Entity, Property, Index } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';

interface ICourseProperties {
	name: string;
	description?: string;
	schoolId: EntityId;
	teacherIds?: EntityId[];
	substitutionTeacherIds?: EntityId[];
	studentIds?: EntityId[];
	// TODO: color format
	color?: string;
}

// that is really really shit default handling :D constructor, getter, js default, em default...what the hell
// i hope it can cleanup with adding schema instant of I...Properties.
export const DEFAULT = {
	color: '#ACACAC',
	name: 'Kurse',
	description: '',
	groups: [],
};

@Entity({ tableName: 'courses' })
export class Course extends BaseEntityWithTimestamps {
	@Property({ default: DEFAULT.name })
	private name: string;

	@Property({ default: DEFAULT.description })
	private description: string;

	@Index()
	@Property()
	private schoolId: EntityId;

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
	private isTeacher(userId: EntityId): boolean {
		const isTeacher = this.teacherIds.includes(userId);
		return isTeacher;
	}

	private isSubstitutionTeacher(userId: EntityId): boolean {
		const isSubstitutionTeacher = this.substitutionTeacherIds.includes(userId);
		return isSubstitutionTeacher;
	}

	/**
	 * Important using hasWritePermissions and isMember as read and write permission interpretation,
	 * is only a temporary solution until we have implement an authorization interface that can used.
	 */
	hasWritePermission(userId: EntityId): boolean {
		const isPrivilegedMember = this.isTeacher(userId) || this.isSubstitutionTeacher(userId);
		return isPrivilegedMember;
	}
}

import { Entity, Property, Index } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';
import { IGridElementReference, GridElementReferenceMetadata } from './dashboard.entity';

interface ICourseProperties {
	name: string;
	description?: string;
	schoolId: ObjectId;
	teacherIds?: ObjectId[];
	substitutionTeacherIds?: ObjectId[];
	studentIds?: ObjectId[];
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
export class Course extends BaseEntityWithTimestamps implements IGridElementReference {
	@Property({ default: DEFAULT.name })
	name: string = DEFAULT.name;

	@Property({ default: DEFAULT.description })
	description: string = DEFAULT.description;

	@Index()
	@Property()
	schoolId: ObjectId;

	@Index()
	@Property({ fieldName: 'userIds' })
	studentIds: ObjectId[] = [];

	@Index()
	@Property()
	teacherIds: ObjectId[] = [];

	@Index()
	@Property({ fieldName: 'substitutionIds' })
	substitutionTeacherIds: ObjectId[] = [];

	// TODO: string color format
	@Property({ default: DEFAULT.color })
	color: string = DEFAULT.color;

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
		// TODO remove "|| []" when we can rely on db schema integrity
		return (this.studentIds || []).length;
	}

	getMetadata(): GridElementReferenceMetadata {
		return {
			id: this.id,
			title: this.name,
			shortTitle: this.name.substr(0, 2),
			displayColor: this.color,
		};
	}

	getDescriptions(): { color: string; id: EntityId; name: string; description: string } {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			color: this.color,
		};
	}

	/**
	 * Important user group operations are only a temporary solution until we have established groups
	 */
	private isTeacher(userId: EntityId): boolean {
		// TODO remove "|| []" when we can rely on db schema integrity
		const isTeacher = (this.teacherIds || []).map((id) => id.toHexString()).includes(userId);
		return isTeacher;
	}

	private isSubstitutionTeacher(userId: EntityId): boolean {
		// TODO remove "|| []" when we can rely on db schema integrity
		const isSubstitutionTeacher = (this.substitutionTeacherIds || []).map((id) => id.toHexString()).includes(userId);
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

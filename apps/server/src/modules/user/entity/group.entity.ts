import { Entity, Property, Index } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId, PermissionsTypes } from '@shared/domain';

/**
 * Why "group" also the id list of userIds seperatly?
 * If we want to have a group collection in future,
 * we can add the id of this groups to the learning room (that include the stuff from teams, classes, course, coursgroups, editor, multiple sub groups...)
 * The lerning room ressources and childs hold all the related informations but not the userId numbers.
 * This are the part of the IDM group, class, school, user management.
 * If we run a sync we only want to update this id list and not the content that is linked with it.
 *
 * To get closer to this target we must start to collect this informations on this place and later replace this with a real group collection.
 */

//  TODO: For search optimization we should work with schoolId.

export enum UserGroupTypes {
	CourseSubstitutionTeachers = 'course-substitution-teachers',
	CourseTeachers = 'course-teachers',
	CourseStudents = 'course-students',
	CoursegroupStudents = 'coursegroup-students',
}

interface IGroupProperties {
	parent?: EntityId;
	type: UserGroupTypes; // TODO: Enum course-teacher, course-substitutionTeacher, course-students, coursegroup-students
	userIds: EntityId[];
	name?: string;
	permission?: PermissionsTypes;
	schoolId?: EntityId;
}

export class GroupEntity extends BaseEntityWithTimestamps {
	@Property()
	@Index()
	parent: EntityId | null;

	@Property()
	@Index()
	userIds: EntityId[];

	@Property()
	@Index()
	type: UserGroupTypes;

	@Property()
	name: string;

	@Property()
	schoolId: EntityId | null;

	permission?: PermissionsTypes;

	constructor(props: IGroupProperties) {
		super();
		this.parent = props.parent || null;
		this.userIds = props.userIds;
		this.type = props.type;
		this.name = props.name || '';
		this.permission = props.permission || PermissionsTypes.Empty;
		this.schoolId = props.schoolId || null;

		Object.assign(this, {});
	}

	hasParent(): boolean {
		return this.parent !== null;
	}
}

class GroupEntityCollection {
	groups: GroupEntity[];

	constructor(groups?: GroupEntity[]) {
		this.groups = groups || [];
	}

	getExistingParentIds(): EntityId[] {
		const parentIds: EntityId[] = [];
		this.groups.forEach((group) => {
			if (group.hasParent()) {
				parentIds.push(group.parent as EntityId);
			}
		});
		return parentIds;
	}

	push(props: IGroupProperties): void {
		this.groups.push(new GroupEntity(props));
	}

	getNumberOfGroups(): number {
		return this.groups.length;
	}

	getGroupsByParentId(parentId: EntityId): GroupEntity[] {
		const foundGroups = this.groups.filter((group) => group.parent === parentId);
		return foundGroups;
	}
}

interface ICoursegroupProperties {
	parent: EntityId;
	studentIds: EntityId[];
}

@Entity({ tableName: 'coursegroups' })
export class CoursegroupEntity extends BaseEntityWithTimestamps {
	@Property({ fieldName: 'courseId' })
	@Index()
	parent: EntityId;

	@Property({ fieldName: 'userIds' })
	@Index()
	studentIds: EntityId[];

	constructor(props: ICoursegroupProperties) {
		super();
		this.parent = props.parent;
		this.studentIds = props.studentIds;
		Object.assign(this, {});
	}
}

// TODO: must split later in 3 groups
interface ICourseProperties {
	studentIds?: EntityId[];
	teacherIds?: EntityId[];
	substitutionIds?: EntityId[];
}

@Entity({ tableName: 'courses' })
export class CourseEntity extends BaseEntityWithTimestamps {
	@Property({ fieldName: 'userIds' })
	studentIds: EntityId[];

	@Property({ fieldName: 'teacherIds' })
	teacherIds: EntityId[];

	@Property({ fieldName: 'substitutionIds' })
	substitutionIds: EntityId[];

	constructor(props: ICourseProperties) {
		super();
		this.studentIds = props.studentIds || [];
		this.teacherIds = props.teacherIds || [];
		this.substitutionIds = props.substitutionIds || [];
		Object.assign(this, {});
	}
}

export class FilteredCourseGroups {
	[UserGroupTypes.CourseStudents]: GroupEntityCollection;

	[UserGroupTypes.CourseTeachers]: GroupEntityCollection;

	[UserGroupTypes.CourseSubstitutionTeachers]: GroupEntityCollection;

	[UserGroupTypes.CoursegroupStudents]: GroupEntityCollection;

	constructor() {
		this[UserGroupTypes.CourseStudents] = new GroupEntityCollection();
		this[UserGroupTypes.CourseTeachers] = new GroupEntityCollection();
		this[UserGroupTypes.CourseSubstitutionTeachers] = new GroupEntityCollection();
		this[UserGroupTypes.CoursegroupStudents] = new GroupEntityCollection();
	}

	getGroupsByParentId(parentId: EntityId): GroupEntity[] {
		const CourseStudents = this[UserGroupTypes.CourseStudents].getGroupsByParentId(parentId);
		const CourseTeachers = this[UserGroupTypes.CourseTeachers].getGroupsByParentId(parentId);
		const CourseSubstitutionTeachers = this[UserGroupTypes.CourseSubstitutionTeachers].getGroupsByParentId(parentId);
		const CoursegroupStudents = this[UserGroupTypes.CoursegroupStudents].getGroupsByParentId(parentId);
		return [...CourseStudents, ...CourseTeachers, ...CourseSubstitutionTeachers, ...CoursegroupStudents];
	}
}

import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { CourseFeatures } from '../repo';
import { CourseSyncAttribute } from './interface';

export interface CourseProps extends AuthorizableObject {
	name: string;

	description?: string;

	schoolId: EntityId;

	studentIds: EntityId[];

	teacherIds: EntityId[];

	substitutionTeacherIds: EntityId[];

	courseGroupIds: EntityId[];

	color: string;

	startDate?: Date;

	untilDate?: Date;

	copyingSince?: Date;

	shareToken?: string;

	features: Set<CourseFeatures>;

	classIds: EntityId[];

	groupIds: EntityId[];

	syncedWithGroup?: EntityId;

	excludeFromSync?: CourseSyncAttribute[];
}

export class Course extends DomainObject<CourseProps> {
	get name(): string {
		return this.props.name;
	}

	set name(value: string) {
		this.props.name = value;
	}

	get students(): EntityId[] {
		return this.props.studentIds;
	}

	set students(value: EntityId[]) {
		this.props.studentIds = value;
	}

	get teachers(): EntityId[] {
		return this.props.teacherIds;
	}

	set teachers(value: EntityId[]) {
		this.props.teacherIds = value;
	}

	get substitutionTeachers(): EntityId[] {
		return this.props.substitutionTeacherIds;
	}

	set substitutionTeachers(value: EntityId[]) {
		this.props.substitutionTeacherIds = value;
	}

	set classes(value: EntityId[]) {
		this.props.classIds = value;
	}

	get classes(): EntityId[] {
		return this.props.classIds;
	}

	set groups(value: EntityId[]) {
		this.props.groupIds = value;
	}

	get groups(): EntityId[] {
		return this.props.groupIds;
	}

	set startDate(value: Date | undefined) {
		this.props.startDate = value;
	}

	set untilDate(value: Date | undefined) {
		this.props.untilDate = value;
	}

	set syncedWithGroup(value: EntityId | undefined) {
		this.props.syncedWithGroup = value;
	}

	get syncedWithGroup(): EntityId | undefined {
		return this.props.syncedWithGroup;
	}

	set excludeFromSync(values: CourseSyncAttribute[] | undefined) {
		this.props.excludeFromSync = values ? [...new Set(values)] : undefined;
	}

	get excludeFromSync(): CourseSyncAttribute[] | undefined {
		return this.props.excludeFromSync;
	}

	public isTeacher(userId: EntityId): boolean {
		const isTeacher: boolean = this.teachers.some((teacherId: EntityId) => teacherId === userId);

		return isTeacher;
	}
}

import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { CourseFeatures } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

export interface CourseProps extends AuthorizableObject {
	name: string;

	description: string;

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
}

export class Course extends DomainObject<CourseProps> {
	get name(): string {
		return this.props.name;
	}

	set name(value: string) {
		this.props.name = value;
	}

	get studentIds(): EntityId[] {
		return this.props.studentIds;
	}

	set studentIds(value: EntityId[]) {
		this.props.studentIds = value;
	}

	get teacherIds(): EntityId[] {
		return this.props.teacherIds;
	}

	set teacherIds(value: EntityId[]) {
		this.props.teacherIds = value;
	}

	get startDate(): Date | undefined {
		return this.props.startDate;
	}

	set startDate(value: Date | undefined) {
		this.props.startDate = value;
	}

	get untilDate(): Date | undefined {
		return this.props.untilDate;
	}

	set untilDate(value: Date | undefined) {
		this.props.untilDate = value;
	}

	get syncedWithGroup(): EntityId | undefined {
		return this.props.syncedWithGroup;
	}

	set syncedWithGroup(value: EntityId | undefined) {
		this.props.syncedWithGroup = value;
	}
}

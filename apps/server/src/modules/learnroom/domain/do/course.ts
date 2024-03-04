import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { CourseFeatures } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

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
}

export class Course extends DomainObject<CourseProps> {
	get name(): string {
		return this.props.name;
	}

	set name(value: string) {
		this.props.name = value;
	}

	set studentIds(value: EntityId[]) {
		this.props.studentIds = value;
	}

	set teacherIds(value: EntityId[]) {
		this.props.teacherIds = value;
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
}

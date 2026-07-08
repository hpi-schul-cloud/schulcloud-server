import { type CourseSyncAttribute } from '@modules/course';
import { type AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { type EntityId } from '@shared/domain/types';

export interface CourseSynchronizationHistoryProps extends AuthorizableObject {
	externalGroupId: string;

	synchronizedCourse: EntityId;

	expiresAt: Date;

	excludeFromSync?: CourseSyncAttribute[];
}

export class CourseSynchronizationHistory extends DomainObject<CourseSynchronizationHistoryProps> {
	get externalGroupId(): string {
		return this.props.externalGroupId;
	}

	get synchronizedCourse(): EntityId {
		return this.props.synchronizedCourse;
	}

	get expiresAt(): Date {
		return this.props.expiresAt;
	}

	get excludeFromSync(): CourseSyncAttribute[] | undefined {
		return this.props.excludeFromSync;
	}
}

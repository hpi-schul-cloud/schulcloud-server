import { SyncAttribute } from '@modules/course';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface CourseSynchronizationHistoryProps extends AuthorizableObject {
	externalGroupId: string;

	synchronizedCourse: EntityId;

	expiresAt: Date;

	excludeFromSync?: SyncAttribute[];
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

	get excludeFromSync(): SyncAttribute[] | undefined {
		return this.props.excludeFromSync;
	}
}

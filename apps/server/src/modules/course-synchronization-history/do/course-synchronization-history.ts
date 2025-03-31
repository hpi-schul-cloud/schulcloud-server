import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface CourseSynchronizationHistoryProps extends AuthorizableObject {
	externalGroupId: string;

	synchronizedCourse: EntityId;

	expiresAt: Date;
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
}

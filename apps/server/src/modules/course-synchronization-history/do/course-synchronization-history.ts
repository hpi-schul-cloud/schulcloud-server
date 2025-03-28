import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export type CourseSynchronizationHistorySaveProps = Omit<CourseSynchronizationHistoryProps, 'id' | 'expirationDate'>;

export interface CourseSynchronizationHistoryProps extends AuthorizableObject {
	externalGroupId: string;

	synchronizedCourse: EntityId;

	expirationDate: Date;
}

export class CourseSynchronizationHistory extends DomainObject<CourseSynchronizationHistoryProps> {
	get externalGroupId(): string {
		return this.props.externalGroupId;
	}

	get synchronizedCourse(): EntityId {
		return this.props.synchronizedCourse;
	}

	get expirationDate(): Date {
		return this.props.expirationDate;
	}
}

import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { SynchronizationStatusModel } from '../types';

export interface SynchronizationProps extends AuthorizableObject {
	createdAt?: Date;
	updatedAt?: Date;
	systemId?: string;
	count?: number;
	failureCause?: string;
	status?: SynchronizationStatusModel;
}

export class Synchronization extends DomainObject<SynchronizationProps> {
	get createdAt(): Date | undefined {
		return this.props.createdAt;
	}

	get updatedAt(): Date | undefined {
		return this.props.updatedAt;
	}

	get systemId(): string | undefined {
		return this.props.systemId;
	}

	get count(): number | undefined {
		return this.props.count;
	}

	get failureCause(): string | undefined {
		return this.props.failureCause;
	}

	get status(): SynchronizationStatusModel | undefined {
		return this.props.status;
	}
}

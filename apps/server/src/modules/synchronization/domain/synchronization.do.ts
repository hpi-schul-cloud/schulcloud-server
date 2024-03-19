import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { StatusModel } from '@shared/domain/types';

export interface SynchronizationProps extends AuthorizableObject {
	createdAt?: Date;
	updatedAt?: Date;
	count?: number;
	failureCause?: string;
	status?: StatusModel;
}

export class Synchronization extends DomainObject<SynchronizationProps> {
	get createdAt(): Date | undefined {
		return this.props.createdAt;
	}

	get updatedAt(): Date | undefined {
		return this.props.updatedAt;
	}

	get count(): number | undefined {
		return this.props.count;
	}

	get failureCause(): string | undefined {
		return this.props.failureCause;
	}

	get status(): StatusModel | undefined {
		return this.props.status;
	}
}

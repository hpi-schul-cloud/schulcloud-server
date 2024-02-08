import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export interface SynchronizationProps extends AuthorizableObject {
	createdAt?: Date;
	updatedAt?: Date;
	count?: number;
	failure?: string;
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

	get failure(): string | undefined {
		return this.props.failure;
	}
}

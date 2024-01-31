import { DomainName, EntityId, OperationType } from '@shared/domain/types';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export interface DeletionLogProps extends AuthorizableObject {
	createdAt?: Date;
	updatedAt?: Date;
	domain: DomainName;
	operation: OperationType;
	count: number;
	refs: string[];
	deletionRequestId?: EntityId;
	performedAt?: Date;
}

export class DeletionLog extends DomainObject<DeletionLogProps> {
	get createdAt(): Date | undefined {
		return this.props.createdAt;
	}

	get updatedAt(): Date | undefined {
		return this.props.updatedAt;
	}

	get domain(): DomainName {
		return this.props.domain;
	}

	get operation(): OperationType {
		return this.props.operation;
	}

	get count(): number {
		return this.props.count;
	}

	get refs(): string[] {
		return this.props.refs;
	}

	get deletionRequestId(): EntityId | undefined {
		return this.props.deletionRequestId;
	}

	get performedAt(): Date | undefined {
		return this.props.performedAt;
	}
}

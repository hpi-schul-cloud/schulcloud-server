import { EntityId } from '@shared/domain/types';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { DomainOperationReport, DomainDeletionReport } from '../interface';
import { DomainName } from '../types';

export interface DeletionLogProps extends AuthorizableObject {
	createdAt?: Date;
	updatedAt?: Date;
	domain: DomainName;
	operations: DomainOperationReport[];
	subdomainOperations?: DomainDeletionReport[];
	deletionRequestId: EntityId;
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

	get operations(): DomainOperationReport[] {
		return this.props.operations;
	}

	get subdomainOperations(): DomainDeletionReport[] | undefined {
		return this.props.subdomainOperations;
	}

	get deletionRequestId(): EntityId {
		return this.props.deletionRequestId;
	}

	get performedAt(): Date | undefined {
		return this.props.performedAt;
	}
}

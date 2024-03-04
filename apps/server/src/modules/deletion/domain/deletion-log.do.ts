import { DomainName, EntityId } from '@shared/domain/types';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { DomainDeletionReport, DomainOperationReport } from '@shared/domain/interface';

export interface DeletionLogProps extends AuthorizableObject {
	createdAt?: Date;
	updatedAt?: Date;
	domain: DomainName;
	domainOperationReport: DomainOperationReport[];
	domainDeletionReport?: DomainDeletionReport;
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

	get domainOperationReport(): DomainOperationReport[] {
		return this.props.domainOperationReport;
	}

	get domainDeletionReport(): DomainDeletionReport | undefined {
		return this.props.domainDeletionReport;
	}

	get deletionRequestId(): EntityId {
		return this.props.deletionRequestId;
	}

	get performedAt(): Date | undefined {
		return this.props.performedAt;
	}
}

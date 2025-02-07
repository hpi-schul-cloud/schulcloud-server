import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { DomainName, BatchStatus } from '../types';

export interface DeletionBatchProps extends AuthorizableObject {
	name: string;
	status: BatchStatus;
	targetRefDomain: DomainName;
	targetRefIds: EntityId[];
	invalidIds: EntityId[];
	skippedIds: EntityId[];
	createdAt: Date;
	updatedAt: Date;
}

// TODO: tests missing
export class DeletionBatch extends DomainObject<DeletionBatchProps> {
	public getProps(): DeletionBatchProps {
		// Note: Propagated hotfix. Will be resolved with mikro-orm update. Look at the comment in board-node.do.ts.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { domainObject, ...copyProps } = this.props;

		return copyProps;
	}

	get name(): string {
		return this.props.name;
	}

	get status(): BatchStatus {
		return this.props.status;
	}

	get targetRefDomain(): DomainName {
		return this.props.targetRefDomain;
	}

	get targetRefIds(): EntityId[] {
		return this.props.targetRefIds;
	}

	get invalidIds(): EntityId[] {
		return this.props.invalidIds;
	}

	get skippedIds(): EntityId[] {
		return this.props.skippedIds;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}
}

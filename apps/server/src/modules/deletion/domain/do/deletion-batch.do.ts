import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { BatchStatus, DomainName } from '../types';

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

export class DeletionBatch extends DomainObject<DeletionBatchProps> {
	public getProps(): DeletionBatchProps {
		// We need to make sure that only properties of type T are returned
		// At runtime the props are a MikroORM entity that has additional non-persisted properties
		// see @Property({ persist: false })
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

	public startDeletion(): void {
		this.props.status = BatchStatus.DELETION_REQUESTED;
	}

	public updateIds({
		targetRefIds,
		invalidIds,
		skippedIds,
	}: {
		targetRefIds: EntityId[];
		invalidIds: EntityId[];
		skippedIds: EntityId[];
	}): void {
		this.props.targetRefIds = targetRefIds;
		this.props.invalidIds = invalidIds;
		this.props.skippedIds = skippedIds;
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

	set updatedAt(value: Date) {
		this.props.updatedAt = value;
	}
}

import { Entity, Enum, Property } from '@mikro-orm/decorators/legacy';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { BatchStatus, DomainName } from '../../domain/types';
import { DeletionBatch, DeletionBatchProps } from '../../domain/do';
import { ArrayType } from '@mikro-orm/core';

@Entity({ tableName: 'deletionbatches' })
export class DeletionBatchEntity extends BaseEntityWithTimestamps implements DeletionBatchProps {
	@Property({ nullable: false })
	name!: string;

	@Property({ nullable: false })
	status!: BatchStatus;

	@Enum({ nullable: false })
	targetRefDomain!: DomainName;

	@Property({ nullable: false, type: ArrayType<EntityId> })
	targetRefIds!: EntityId[];

	@Property({ nullable: false, type: ArrayType<EntityId> })
	invalidIds!: EntityId[];

	@Property({ nullable: false, type: ArrayType<EntityId> })
	skippedIds!: EntityId[];

	@Property({ persist: false })
	domainObject: DeletionBatch | undefined;
}

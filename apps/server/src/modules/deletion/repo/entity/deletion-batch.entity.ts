import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';

export interface DeletionBatchEntityProps {
  id?: EntityId;
  deletionRequestIds: EntityId[];
  createdAt?: Date;
  updatedAt?: Date;
}

@Entity({ tableName: 'deletionbatches' })
export class DeletionBatchEntity extends BaseEntityWithTimestamps {
  @Property()
  deletionRequestIds: EntityId[];

  constructor(props: DeletionBatchEntityProps) {
    super();
    if (props.id !== undefined) {
      this.id = props.id;
    }

    this.deletionRequestIds = props.deletionRequestIds;

    if (props.createdAt !== undefined) {
      this.createdAt = props.createdAt;
    }

    if (props.updatedAt !== undefined) {
      this.updatedAt = props.updatedAt;
    }
  }
}
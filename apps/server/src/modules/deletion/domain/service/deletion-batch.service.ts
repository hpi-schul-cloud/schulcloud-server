import { Injectable } from '@nestjs/common';
import { Counted, EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { DeletionBatchRepo } from '../../repo/deletion-batch.repo';
import { DeletionBatch } from '../do';

// TODO: tests missing
@Injectable()
export class DeletionBatchService {
  constructor(
    private readonly deletionBatchRepo: DeletionBatchRepo
  ) {}

  async create(deletionRequestIds: EntityId[]): Promise<DeletionBatch> {
    const newBatch = new DeletionBatch({
      id: new ObjectId().toHexString(),
      deletionRequestIds,
    });

    await this.deletionBatchRepo.create(newBatch);

    return newBatch;
  }

  async find(skip?: number, limit?: number): Promise<Counted<DeletionBatch[]>> {
    const [batches, total] = await this.deletionBatchRepo.findAndCount(
      {},
      { limit, offset: skip }
    );

    return [batches, total];
  }
}
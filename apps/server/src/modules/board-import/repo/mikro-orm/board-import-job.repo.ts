import { type EntityData, type EntityName } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { type EntityId } from '@shared/domain/types';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { type BoardImportJob, type BoardImportJobRepo, BoardImportJobStatus } from '../../domain';
import { BoardImportJobEntity } from '../entity';
import { BoardImportJobMapper } from '../mapper';

export class BoardImportJobMikroOrmRepo
	extends BaseDomainObjectRepo<BoardImportJob, BoardImportJobEntity>
	implements BoardImportJobRepo
{
	protected get entityName(): EntityName<BoardImportJobEntity> {
		return BoardImportJobEntity;
	}

	protected mapDOToEntityProperties(entityDO: BoardImportJob): EntityData<BoardImportJobEntity> {
		const entityProps = BoardImportJobMapper.mapDOToEntityProperties(entityDO);

		return entityProps;
	}

	public async findById(id: EntityId): Promise<BoardImportJob | null> {
		// The import API and the worker change the same jobs, so a cached entity can be out of date.
		const entity = await this.em.findOne(BoardImportJobEntity, { id }, { refresh: true });

		if (!entity) {
			return null;
		}

		const domainObject = BoardImportJobMapper.mapEntityToDO(entity);

		return domainObject;
	}

	public async startAttempt(id: EntityId, now: Date): Promise<BoardImportJob | null> {
		const document = await this.em.getCollection(BoardImportJobEntity).findOneAndUpdate(
			{
				_id: new ObjectId(id),
				status: { $in: [BoardImportJobStatus.WAITING, BoardImportJobStatus.RUNNING] },
			},
			[
				{
					$set: {
						status: BoardImportJobStatus.RUNNING,
						attempts: { $add: [{ $ifNull: ['$attempts', 0] }, 1] },
						startedAt: { $ifNull: ['$startedAt', now] },
						updatedAt: now,
					},
				},
			],
			{ returnDocument: 'after' }
		);

		if (!document) {
			return null;
		}

		const entity = this.em.map(BoardImportJobEntity, document);
		const domainObject = BoardImportJobMapper.mapEntityToDO(entity);

		return domainObject;
	}

	public async closeAttempt(
		id: EntityId,
		attempts: number,
		status: BoardImportJobStatus.FINISHED | BoardImportJobStatus.FAILED
	): Promise<boolean> {
		const updatedCount = await this.em.nativeUpdate(
			BoardImportJobEntity,
			{ id, status: BoardImportJobStatus.RUNNING, attempts },
			{ status, updatedAt: new Date() }
		);
		const isClosed = updatedCount > 0;

		return isClosed;
	}

	public async failIfWaiting(id: EntityId): Promise<boolean> {
		const updatedCount = await this.em.nativeUpdate(
			BoardImportJobEntity,
			{ id, status: BoardImportJobStatus.WAITING },
			{ status: BoardImportJobStatus.FAILED, updatedAt: new Date() }
		);
		const isFailed = updatedCount > 0;

		return isFailed;
	}
}

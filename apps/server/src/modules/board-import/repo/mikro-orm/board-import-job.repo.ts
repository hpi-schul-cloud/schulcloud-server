import { type EntityData, type EntityName } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { type EntityId } from '@shared/domain/types';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import {
	type BoardImportJob,
	BoardImportJobLogReason,
	BoardImportJobRejectedError,
	type BoardImportJobRepo,
	type BoardImportNote,
	type BoardPlan,
	BoardImportJobStatus,
	BoardImportJobUnreadableError,
} from '../../domain';
import { BoardImportJobEntity, BoardImportNoteEmbeddable } from '../entity';
import { BoardImportJobMapper } from '../mapper';

interface AttemptUpdate {
	$set?: Record<string, unknown>;
	$unset?: Record<string, ''>;
	$push?: Record<string, unknown>;
}

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

		const domainObject = this.mapEntityToDO(entity);

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
		const domainObject = this.mapEntityToDO(entity);

		return domainObject;
	}

	public async closeAttempt(
		id: EntityId,
		attempts: number,
		status: BoardImportJobStatus.FINISHED | BoardImportJobStatus.FAILED,
		failureReason?: BoardImportJobLogReason
	): Promise<boolean> {
		const updatedCount = await this.em.nativeUpdate(
			BoardImportJobEntity,
			{ id, status: BoardImportJobStatus.RUNNING, attempts },
			{ status, updatedAt: new Date(), ...(failureReason && { failureReason }) }
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

	public async failIfOpen(id: EntityId): Promise<boolean> {
		const updatedCount = await this.em.nativeUpdate(
			BoardImportJobEntity,
			{ id, status: { $in: [BoardImportJobStatus.WAITING, BoardImportJobStatus.RUNNING] } },
			{ status: BoardImportJobStatus.FAILED, updatedAt: new Date() }
		);
		const isFailed = updatedCount > 0;

		return isFailed;
	}

	public async setBoardId(id: EntityId, attempts: number, boardId: EntityId): Promise<void> {
		await this.updateInAttempt(id, attempts, { $set: { boardId: new ObjectId(boardId) } });
	}

	public async resetBoard(id: EntityId, attempts: number): Promise<void> {
		await this.updateInAttempt(id, attempts, { $unset: { boardId: '', checkpoints: '' } });
	}

	public async setPlan(id: EntityId, attempts: number, plan: BoardPlan, notes: BoardImportNote[]): Promise<void> {
		const storedNotes = notes.map((note) => new BoardImportNoteEmbeddable(note));

		await this.updateInAttempt(id, attempts, { $set: { plan, notes: storedNotes } });
	}

	public async addColumnCheckpoint(id: EntityId, attempts: number, columnId: EntityId): Promise<void> {
		const checkpoint = BoardImportJobMapper.mapCheckpointToEmbeddable({ columnId, cardIds: [] });

		await this.updateInAttempt(id, attempts, { $push: { checkpoints: checkpoint } });
	}

	public async addCardCheckpoint(id: EntityId, attempts: number, columnIndex: number, cardId: EntityId): Promise<void> {
		await this.updateInAttempt(id, attempts, {
			$push: { [`checkpoints.${columnIndex}.cardIds`]: new ObjectId(cardId) },
		});
	}

	private async updateInAttempt(id: EntityId, attempts: number, update: AttemptUpdate): Promise<void> {
		const result = await this.em.getCollection(BoardImportJobEntity).updateOne(
			{ _id: new ObjectId(id), status: BoardImportJobStatus.RUNNING, attempts },
			{ ...update, $set: { ...update.$set, updatedAt: new Date() } },
			// Without this option, the driver stores the fields that a note does not have as null.
			{ ignoreUndefined: true }
		);

		if (result.matchedCount === 0) {
			throw new BoardImportJobRejectedError(BoardImportJobLogReason.OUTDATED_ATTEMPT);
		}
	}

	private mapEntityToDO(entity: BoardImportJobEntity): BoardImportJob {
		try {
			const domainObject = BoardImportJobMapper.mapEntityToDO(entity);

			return domainObject;
		} catch (error) {
			throw new BoardImportJobUnreadableError(error);
		}
	}
}

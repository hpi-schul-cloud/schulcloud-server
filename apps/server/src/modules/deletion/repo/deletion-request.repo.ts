import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { DeletionRequest } from '../domain/do';
import { DeletionRequestEntity } from './entity';
import { DeletionRequestMapper } from './mapper';
import { DeletionRequestScope } from './scope';
import { StatusModel } from '../domain/types';

@Injectable()
export class DeletionRequestRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName() {
		return DeletionRequestEntity;
	}

	public async findById(deletionRequestId: EntityId): Promise<DeletionRequest> {
		const deletionRequest: DeletionRequestEntity = await this.em.findOneOrFail(DeletionRequestEntity, {
			id: deletionRequestId,
		});

		const mapped: DeletionRequest = DeletionRequestMapper.mapToDO(deletionRequest);

		return mapped;
	}

	public async create(deletionRequests: DeletionRequest | DeletionRequest[]): Promise<void> {
		const deletionRequestEntities = Array.isArray(deletionRequests)
			? deletionRequests.map((deletionRequest) => DeletionRequestMapper.mapToEntity(deletionRequest))
			: [DeletionRequestMapper.mapToEntity(deletionRequests)];

		await this.em.upsertMany(deletionRequestEntities);
		await this.em.flush();
	}

	public async findAllItems(limit: number): Promise<DeletionRequest[]> {
		const scope = new DeletionRequestScope();
		scope.byDeleteAfter(new Date());
		scope.byStatusAndDate([StatusModel.REGISTERED]);

		const order = { createdAt: SortOrder.asc };

		const deletionRequestEntities = await this.em.find(DeletionRequestEntity, scope.query, {
			limit,
			orderBy: order,
		});

		const mapped: DeletionRequest[] = deletionRequestEntities.map((entity) => DeletionRequestMapper.mapToDO(entity));

		return mapped;
	}

	public async findAllFailedItems(limit: number, olderThan: Date, newerThan: Date): Promise<DeletionRequest[]> {
		if (olderThan < newerThan) {
			throw new Error('olderThan must be greater than newerThan');
		}
		const scope = new DeletionRequestScope();
		scope.byDeleteAfter(new Date());
		scope.byStatusAndDate([StatusModel.FAILED, StatusModel.PENDING], olderThan, newerThan);

		const order = { createdAt: SortOrder.asc };

		const deletionRequestEntities = await this.em.find(DeletionRequestEntity, scope.query, {
			limit,
			orderBy: order,
		});

		const mapped: DeletionRequest[] = deletionRequestEntities.map((entity) => DeletionRequestMapper.mapToDO(entity));

		return mapped;
	}

	public async update(deletionRequest: DeletionRequest): Promise<void> {
		const deletionRequestEntity = DeletionRequestMapper.mapToEntity(deletionRequest);
		const referencedEntity = this.em.getReference(DeletionRequestEntity, deletionRequestEntity.id);

		await this.em.persistAndFlush(referencedEntity);
	}

	public async markDeletionRequestAsExecuted(deletionRequestId: EntityId): Promise<boolean> {
		const deletionRequest: DeletionRequestEntity = await this.em.findOneOrFail(DeletionRequestEntity, {
			id: deletionRequestId,
		});

		deletionRequest.executed();
		await this.em.persistAndFlush(deletionRequest);

		return true;
	}

	public async markDeletionRequestAsFailed(deletionRequestId: EntityId): Promise<boolean> {
		const deletionRequest: DeletionRequestEntity = await this.em.findOneOrFail(DeletionRequestEntity, {
			id: deletionRequestId,
		});

		deletionRequest.failed();
		await this.em.persistAndFlush(deletionRequest);

		return true;
	}

	public async markDeletionRequestAsPending(deletionRequestId: EntityId): Promise<boolean> {
		const deletionRequest: DeletionRequestEntity = await this.em.findOneOrFail(DeletionRequestEntity, {
			id: deletionRequestId,
		});

		deletionRequest.pending();
		await this.em.persistAndFlush(deletionRequest);

		return true;
	}

	async deleteById(deletionRequestId: EntityId): Promise<boolean> {
		const entity: DeletionRequestEntity | null = await this.em.findOneOrFail(DeletionRequestEntity, {
			id: deletionRequestId,
		});

		await this.em.removeAndFlush(entity);

		return true;
	}

	public async findByIds(ids: EntityId[]): Promise<(DeletionRequest | null)[]> {
		const entities = await this.em.find(DeletionRequestEntity, { id: { $in: ids } });

		const entityMap = new Map(entities.map((entity) => [entity.id, DeletionRequestMapper.mapToDO(entity)]));

		return ids.map((id) => entityMap.get(id) || null);
	}

	public async findRegisteredByTargetRefId(targetRefIds: EntityId[]): Promise<DeletionRequest[]> {
		const scope = new DeletionRequestScope();
		scope.byUserIdsAndRegistered(targetRefIds);

		const deletionRequestEntities = await this.em.find(DeletionRequestEntity, scope.query);

		const mapped: DeletionRequest[] = deletionRequestEntities.map((entity) => DeletionRequestMapper.mapToDO(entity));

		return mapped;
	}

	public async findFailedByTargetRefId(targetRefIds: EntityId[]): Promise<DeletionRequest[]> {
		const scope = new DeletionRequestScope();
		scope.byUserIdsAndFailed(targetRefIds);

		const deletionRequestEntities = await this.em.find(DeletionRequestEntity, scope.query);

		const mapped: DeletionRequest[] = deletionRequestEntities.map((entity) => DeletionRequestMapper.mapToDO(entity));

		return mapped;
	}

	public async findPendingByTargetRefId(targetRefIds: EntityId[]): Promise<DeletionRequest[]> {
		const scope = new DeletionRequestScope();
		scope.byUserIdsAndPending(targetRefIds);

		const deletionRequestEntities = await this.em.find(DeletionRequestEntity, scope.query);

		const mapped: DeletionRequest[] = deletionRequestEntities.map((entity) => DeletionRequestMapper.mapToDO(entity));

		return mapped;
	}

	public async findSuccessfulByTargetRefId(targetRefIds: EntityId[]): Promise<DeletionRequest[]> {
		const scope = new DeletionRequestScope();
		scope.byUserIdsAndSuccess(targetRefIds);

		const deletionRequestEntities = await this.em.find(DeletionRequestEntity, scope.query);

		const mapped: DeletionRequest[] = deletionRequestEntities.map((entity) => DeletionRequestMapper.mapToDO(entity));

		return mapped;
	}
}

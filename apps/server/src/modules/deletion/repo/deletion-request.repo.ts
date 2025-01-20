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

	async findById(deletionRequestId: EntityId): Promise<DeletionRequest> {
		const deletionRequest: DeletionRequestEntity = await this.em.findOneOrFail(DeletionRequestEntity, {
			id: deletionRequestId,
		});

		const mapped: DeletionRequest = DeletionRequestMapper.mapToDO(deletionRequest);

		return mapped;
	}

	async create(deletionRequest: DeletionRequest): Promise<void> {
		const deletionRequestEntity = DeletionRequestMapper.mapToEntity(deletionRequest);
		this.em.persist(deletionRequestEntity);
		await this.em.flush();
	}

	async findAllItemsToExecution(olderThan: Date, newerThan: Date, limit: number): Promise<DeletionRequest[]> {
		if (olderThan < newerThan) {
			throw new Error('olderThan must be greater than newerThan');
		}
		const scope = new DeletionRequestScope();
		scope.byDeleteAfter(new Date());

		const statusScope = new DeletionRequestScope('$or');
		statusScope.byStatusAndDate(StatusModel.REGISTERED);
		this.addScopeForFailedRequests(statusScope, olderThan, newerThan);

		scope.addQuery(statusScope.query);

		const order = { createdAt: SortOrder.desc }; // TODO why decending order? Should it not be ascending?

		const [deletionRequestEntities] = await this.em.findAndCount(DeletionRequestEntity, scope.query, {
			limit,
			orderBy: order,
		});

		const mapped: DeletionRequest[] = deletionRequestEntities.map((entity) => DeletionRequestMapper.mapToDO(entity));

		return mapped;
	}

	private addScopeForFailedRequests(scope: DeletionRequestScope, olderThan: Date, newerThan: Date): void {
		scope.byStatusAndDate(StatusModel.FAILED, olderThan, newerThan);
		scope.byStatusAndDate(StatusModel.PENDING, olderThan, newerThan);
	}

	async countPendingDeletionRequests(olderThan: Date, newerThan: Date): Promise<number> {
		const scope = new DeletionRequestScope();
		this.addScopeForFailedRequests(scope, olderThan, newerThan);

		const numberItemsWithStatusPending: number = await this.em.count(DeletionRequestEntity, scope.query);

		return numberItemsWithStatusPending;
	}

	async update(deletionRequest: DeletionRequest): Promise<void> {
		const deletionRequestEntity = DeletionRequestMapper.mapToEntity(deletionRequest);
		const referencedEntity = this.em.getReference(DeletionRequestEntity, deletionRequestEntity.id);

		await this.em.persistAndFlush(referencedEntity);
	}

	async markDeletionRequestAsExecuted(deletionRequestId: EntityId): Promise<boolean> {
		const deletionRequest: DeletionRequestEntity = await this.em.findOneOrFail(DeletionRequestEntity, {
			id: deletionRequestId,
		});

		deletionRequest.executed();
		await this.em.persistAndFlush(deletionRequest);

		return true;
	}

	async markDeletionRequestAsFailed(deletionRequestId: EntityId): Promise<boolean> {
		const deletionRequest: DeletionRequestEntity = await this.em.findOneOrFail(DeletionRequestEntity, {
			id: deletionRequestId,
		});

		deletionRequest.failed();
		await this.em.persistAndFlush(deletionRequest);

		return true;
	}

	async markDeletionRequestAsPending(deletionRequestId: EntityId): Promise<boolean> {
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
}

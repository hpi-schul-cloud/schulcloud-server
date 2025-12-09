import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { HelpdeskProblem } from '../domain/do';
import { HelpdeskProblemRepo } from '../domain/interface';
import { HelpdeskProblemEntity } from './helpdesk-problem.entity';
import { HelpdeskProblemMapper } from './mapper';

@Injectable()
export class HelpdeskProblemMikroOrmRepo implements HelpdeskProblemRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(id: EntityId): Promise<HelpdeskProblem> {
		const entity = await this.em.findOneOrFail(HelpdeskProblemEntity, id);
		const domainObject = HelpdeskProblemMapper.mapToDO(entity);
		return domainObject;
	}

	async findBySchoolId(schoolId: EntityId, options?: { limit?: number; skip?: number }): Promise<HelpdeskProblem[]> {
		const entities = await this.em.find(
			HelpdeskProblemEntity,
			{ schoolId },
			{
				limit: options?.limit || 25,
				offset: options?.skip || 0,
				orderBy: { createdAt: 'DESC' },
			}
		);
		return entities.map((entity) => HelpdeskProblemMapper.mapToDO(entity));
	}

	async save(problem: HelpdeskProblem): Promise<HelpdeskProblem> {
		let entity: HelpdeskProblemEntity;

		if (problem.id) {
			entity = await this.em.findOneOrFail(HelpdeskProblemEntity, problem.id);
			HelpdeskProblemMapper.mapDOToEntityProperties(problem, entity);
		} else {
			entity = HelpdeskProblemMapper.mapDOToEntityProperties(problem);
		}

		await this.em.persistAndFlush(entity);
		return HelpdeskProblemMapper.mapToDO(entity);
	}

	async delete(id: EntityId): Promise<void> {
		const entity = await this.em.findOneOrFail(HelpdeskProblemEntity, id);
		await this.em.removeAndFlush(entity);
	}
}

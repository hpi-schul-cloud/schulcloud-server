import { Injectable } from '@nestjs/common';
import { FederalStateEntity } from '@shared/domain';
import { EntityManager } from '@mikro-orm/mongodb';
import { FederalStateDO } from '../domainobject/federal-state.do';

@Injectable()
export class FederalStateRepo {
	constructor(private readonly em: EntityManager) {}

	async findByName(name: string): Promise<FederalStateDO> {
		const federalStateEntity = await this.em.findOneOrFail(FederalStateEntity, { name });
		const federalState = this.mapEntityToDomainObject(federalStateEntity);
		return federalState;
	}

	async findAll(): Promise<FederalStateDO[]> {
		const federalStateEntities = await this.em.find(FederalStateEntity, {});
		const federalStates = federalStateEntities.map((entity) => this.mapEntityToDomainObject(entity));
		return federalStates;
	}

	protected mapEntityToDomainObject(entity: FederalStateEntity): FederalStateDO {
		return new FederalStateDO({
			id: entity.id,
			name: entity.name,
			abbreviation: entity.abbreviation,
			logoUrl: entity.logoUrl,
			counties: entity.counties,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		});
	}
}

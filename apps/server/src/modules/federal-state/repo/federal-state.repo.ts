import { EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { FederalStateDO } from '../domainobject';
import { FederalStateEntity } from '../entity';

@Injectable()
export class FederalStateRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName(): EntityName<FederalStateEntity> {
		return FederalStateEntity;
	}

	async findByName(name: string): Promise<FederalStateDO> {
		const federalStateEntity = await this.em.findOneOrFail(FederalStateEntity, { name });
		const federalState = this.mapEntityToDomainObject(federalStateEntity);
		return federalState;
	}

	async findAll(): Promise<FederalStateDO[]> {
		const federalStateEntities = await this.em.find(FederalStateEntity, {});
		const federalStates = federalStateEntities.map((federalStateEntity) =>
			this.mapEntityToDomainObject(federalStateEntity)
		);
		return federalStates;
	}

	mapEntityToDomainObject(entity: FederalStateEntity): FederalStateDO {
		const federalStateDo = new FederalStateDO({
			id: entity.id,
			name: entity.name,
			abbreviation: entity.abbreviation,
			logoUrl: entity.logoUrl,
			counties: entity.counties,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		});
		return federalStateDo;
	}
}

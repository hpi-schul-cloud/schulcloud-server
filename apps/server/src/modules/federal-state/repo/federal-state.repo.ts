import { EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { FederalStateDO } from '../domainobject';
import { County, FederalStateEntity } from '../entity';
import { IFederalStateCreate } from '../interface';

@Injectable()
export class FederalStateRepo extends BaseRepo<FederalStateEntity> {
	get entityName(): EntityName<FederalStateEntity> {
		return FederalStateEntity;
	}

	async findByName(name: string): Promise<FederalStateDO> {
		// const federalStateEntity = await this.findOneOrFail(FederalStateEntity, { name });
		const federalStateEntity = await this._em.findOneOrFail(FederalStateEntity, { name });
		const federalState = this.mapFederalStateEntityToDomainObject(federalStateEntity);
		return federalState;
	}

	async findAll(): Promise<FederalStateDO[]> {
		const federalStateEntities = await this._em.find(FederalStateEntity, {});
		await this._em.populate(federalStateEntities, ['counties']);
		const federalStates = federalStateEntities.map((federalStateEntity) =>
			this.mapFederalStateEntityToDomainObject(federalStateEntity)
		);
		return federalStates;
	}

	async deleteFederalState(federalStateId: string): Promise<FederalStateDO> {
		const federalStateEntity = await this.findById(federalStateId);
		await this.delete(federalStateEntity);
		const federalState = this.mapFederalStateEntityToDomainObject(federalStateEntity);
		return federalState;
	}

	async createFederalState(federalStateCreate: IFederalStateCreate): Promise<FederalStateDO> {
		const federalStateEntity = new FederalStateEntity({
			...federalStateCreate,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		await this.save(federalStateEntity);
		const federalStateDo = this.mapFederalStateEntityToDomainObject(federalStateEntity);
		return federalStateDo;
	}

	mapFederalStateEntityToDomainObject(entity: FederalStateEntity): FederalStateDO {
		const federalStateDo = new FederalStateDO({
			id: entity.id,
			name: entity.name,
			abbreviation: entity.abbreviation,
			logoUrl: entity.logoUrl,
			counties: entity.counties
				? entity.counties.map((county) => this.mapCountyEntityToDomainObject(county))
				: undefined,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		});
		return federalStateDo;
	}

	mapCountyEntityToDomainObject(countyEntity: County) {
		console.log('countyEntity', countyEntity);
		const county = {
			name: countyEntity.name,
			countyId: countyEntity.countyId,
			antaresKey: countyEntity.antaresKey,
		};
		return county;
	}
}

import { EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { FederalStateEntity } from '@shared/domain/entity';
import { BaseRepo } from '@shared/repo/base.repo';
import { ObjectId } from 'bson';
// import { CountyDO } from '../domainobject/county.do';
// TODO: remove dead code
@Injectable()
export class FederalStateRepo extends BaseRepo<FederalStateEntity> {
	get entityName(): EntityName<FederalStateEntity> {
		return FederalStateEntity;
	}

	// async findByName(name: string): Promise<FederalStateDO> {
	// 	// const federalStateEntity = await this.findOneOrFail(FederalStateEntity, { name });
	// 	const federalStateEntity = await this._em.findOneOrFail(FederalStateEntity, { name });
	// 	const federalState = this.mapFederalStateEntityToDomainObject(federalStateEntity);
	// 	return federalState;
	// }

	async findAll(): Promise<FederalStateEntity[]> {
		const federalStates = await this.findAll();
		await this._em.populate(federalStates, ['counties']);
		return federalStates;
	}

	async findById(id: ObjectId): Promise<FederalStateEntity> {
		const federalState = await this.findById(id);
		await this._em.populate(federalState, ['counties']);
		return federalState;
	}

	// async deleteFederalState(federalStateId: string): Promise<FederalStateDO> {
	// 	const federalStateEntity = await this.findById(federalStateId);
	// 	await this.delete(federalStateEntity);
	// 	const federalState = this.mapFederalStateEntityToDomainObject(federalStateEntity);
	// 	return federalState;
	// }

	// async createFederalState(federalStateCreate: IFederalStateCreate): Promise<FederalStateDO> {
	// 	const federalStateEntity = new FederalStateEntity({
	// 		...federalStateCreate,
	// 		createdAt: new Date(),
	// 		updatedAt: new Date(),
	// 	});
	// 	await this.save(federalStateEntity);
	// 	const federalStateDo = this.mapFederalStateEntityToDomainObject(federalStateEntity);
	// 	return federalStateDo;
	// }

	// mapFederalStateEntityToDomainObject(entity: FederalStateEntity): FederalStateDO {
	// 	const federalStateDo = new FederalStateDO({
	// 		id: entity.id,
	// 		name: entity.name,
	// 		abbreviation: entity.abbreviation,
	// 		logoUrl: entity.logoUrl,
	// 		counties: entity.counties
	// 			? entity.counties.map((county) => this.mapCountyEntityToDomainObject(county))
	// 			: undefined,
	// 		createdAt: entity.createdAt,
	// 		updatedAt: entity.updatedAt,
	// 	});
	// 	return federalStateDo;
	// }

	// mapCountyEntityToDomainObject(countyEntity: County): CountyDO {
	// 	const county = new CountyDO({
	// 		name: countyEntity.name,
	// 		countyId: countyEntity.countyId,
	// 		antaresKey: countyEntity.antaresKey,
	// 	});
	// 	return county;
	// }
}

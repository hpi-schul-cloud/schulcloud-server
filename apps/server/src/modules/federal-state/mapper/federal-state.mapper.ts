import { County, FederalStateEntity } from '@shared/domain/entity';
import { FederalStateDO } from '../domainobject';
import { CountyDO } from '../domainobject/county.do';

export class FederalStateMapper {
	static mapCountyEntityToDO(entity: County): CountyDO {
		const county = new CountyDO({
			name: entity.name,
			countyId: entity.countyId,
			antaresKey: entity.antaresKey,
		});
		return county;
	}

	static mapFederalStateEntityToDO(entity: FederalStateEntity): FederalStateDO {
		const federalStateDo = new FederalStateDO({
			id: entity.id,
			name: entity.name,
			abbreviation: entity.abbreviation,
			logoUrl: entity.logoUrl,
			counties: entity.counties
				? entity.counties.map((county) => FederalStateMapper.mapCountyEntityToDO(county))
				: undefined,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		});
		return federalStateDo;
	}
}

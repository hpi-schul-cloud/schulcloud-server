import { CountyDO } from '../../domainobject/county.do';
import { FederalStateDO } from '../../domainobject/federal-state.do';
import { FederalStateResponse } from '../dto/federal-state.response';

export class FederalStateMapper {
	static mapFederalStateToResponse(federalStateDO: FederalStateDO): FederalStateResponse {
		const dto = new FederalStateResponse({
			id: federalStateDO.id,
			name: federalStateDO.name,
			abbreviation: federalStateDO.abbreviation,
			counties: federalStateDO.counties
				? federalStateDO.counties.map((county) => this.mapCountyToResponse(county))
				: undefined,
			logoUrl: federalStateDO.logoUrl,
			createdAt: federalStateDO.createdAt,
			updatedAt: federalStateDO.updatedAt,
		});
		return dto;
	}

	static mapCountyToResponse(countyDO: CountyDO) {
		const county = {
			name: countyDO.name,
			countyId: countyDO.countyId,
			antaresKey: countyDO.antaresKey,
		};
		return county;
	}
}

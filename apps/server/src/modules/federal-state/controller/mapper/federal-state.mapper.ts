import { FederalStateDO, ICounty } from '../../domainobject/federal-state.do';
import { CountyResponse } from '../dto';
import { FederalStateResponse } from '../dto/federal-state.response';

export class FederalStateMapper {
	static mapFederalStateToResponse(federalStateDO: FederalStateDO): FederalStateResponse {
		const dto = new FederalStateResponse({
			_id: federalStateDO.id,
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

	static mapCountyToResponse(county: ICounty) {
		const countyResponse = {
			name: county.name,
			countyId: county.countyId,
			antaresKey: county.antaresKey,
		};
		return countyResponse;
	}
}

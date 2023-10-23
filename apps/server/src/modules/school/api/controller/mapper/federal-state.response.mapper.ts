import { County } from '../../../domain';
import { FederalStateDto } from '../../../domain/dto';
import { FederalStateResponse } from '../response';
import { CountyResponse } from '../response/county.response';

export class FederalStateResponseMapper {
	public static mapToResponse(federalState: FederalStateDto): FederalStateResponse {
		const counties = federalState.counties && this.mapToCountyResponses(federalState.counties);

		const res = new FederalStateResponse({
			...federalState,
			counties,
		});

		return res;
	}

	private static mapToCountyResponses(counties: County[]): CountyResponse[] {
		const res = counties.map((county) => this.mapToCountyResponse(county));

		return res;
	}

	private static mapToCountyResponse(county: County): CountyResponse {
		const res = new CountyResponse({
			name: county.name,
			countyId: county.countyId,
			antaresKey: county.antaresKey,
		});

		return res;
	}
}

import { County, FederalState } from '../../domain';
import { CountyResponse, FederalStateResponse } from '../dto/response';

export class FederalStateResponseMapper {
	public static mapToResponse(federalState: FederalState): FederalStateResponse {
		const federalStateProps = federalState.getProps();
		const counties = federalStateProps.counties && this.mapToCountyResponses(federalStateProps.counties);

		const res = new FederalStateResponse({
			...federalStateProps,
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
			...county,
		});

		return res;
	}
}

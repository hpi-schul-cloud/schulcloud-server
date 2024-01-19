import { County } from '../../domain';
import { CountyResponse } from '../dto/response';

export class CountyResponseMapper {
	public static mapToResponse(county: County): CountyResponse {
		const countyProps = county.getProps();

		const res = new CountyResponse({
			...countyProps,
		});

		return res;
	}

	public static mapToResponses(counties: County[]): CountyResponse[] {
		const res = counties.map((county) => CountyResponseMapper.mapToResponse(county));

		return res;
	}
}

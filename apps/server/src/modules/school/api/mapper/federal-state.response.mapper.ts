import { FederalState } from '../../domain';
import { FederalStateResponse } from '../dto/response';
import { CountyResponseMapper } from './county.response.mapper';

export class FederalStateResponseMapper {
	public static mapToResponse(federalState: FederalState): FederalStateResponse {
		const federalStateProps = federalState.getProps();
		const counties = federalStateProps.counties && CountyResponseMapper.mapToResponses(federalStateProps.counties);

		const res = new FederalStateResponse({
			...federalStateProps,
			counties,
		});

		return res;
	}
}

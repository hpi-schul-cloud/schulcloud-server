import { FederalState } from '../../domain';
import { FederalStateResponse } from '../dto/response';

export class FederalStateResponseMapper {
	public static mapToResponse(federalState: FederalState): FederalStateResponse {
		const federalStateProps = federalState.getProps();
		const counties = federalStateProps.counties?.map((county) => county.getProps());

		const res = {
			...federalStateProps,
			counties,
		};

		return res;
	}
}

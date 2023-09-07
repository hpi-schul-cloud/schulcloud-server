import { FederalStateDO } from '../../domainobject/federal-state.do';
import { FederalStateResponse } from '../dto/federal-state.response';

export class FederalStateMapper {
	static mapToResponse(federalStateDO: FederalStateDO): FederalStateResponse {
		const dto = new FederalStateResponse({
			id: federalStateDO.id,
			name: federalStateDO.name,
			abbreviation: federalStateDO.abbreviation,
			logoUrl: federalStateDO.logoUrl,
			createdAt: federalStateDO.createdAt,
			updatedAt: federalStateDO.updatedAt,
		});
		return dto;
	}
}

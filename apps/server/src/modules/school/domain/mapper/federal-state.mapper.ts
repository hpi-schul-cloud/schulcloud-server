import { FederalState } from '../do';
import { FederalStateDto } from '../dto';

export class FederalStateMapper {
	public static mapToDto(federalState: FederalState): FederalStateDto {
		const federalStateProps = federalState.getProps();

		const dto = new FederalStateDto({
			id: federalState.id,
			name: federalStateProps.name,
			abbreviation: federalStateProps.abbreviation,
			logoUrl: federalStateProps.logoUrl,
			counties: federalStateProps.counties,
		});

		return dto;
	}
}

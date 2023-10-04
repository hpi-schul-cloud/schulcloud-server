import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SchoolFeatures, SchoolPurpose } from '../../domain';
import { CountyResponse } from './county.response';
import { FederalStateResponse } from './federal-state.response';
import { SchoolYearResponse } from './school-year.response';
import { SystemResponse } from './system.response';

export class SchoolResponse {
	constructor({
		id,
		name,
		officialSchoolNumber,
		federalState,
		currentYear,
		purpose,
		features,
		county,
		systems,
		inMaintenance,
	}: SchoolResponse) {
		this.id = id;
		this.name = name;
		this.officialSchoolNumber = officialSchoolNumber;
		this.federalState = federalState;
		this.currentYear = currentYear;
		this.purpose = purpose;
		this.features = features;
		this.county = county;
		this.systems = systems;
		this.inMaintenance = inMaintenance;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	officialSchoolNumber?: string;

	@ApiProperty({ type: () => SchoolYearResponse })
	currentYear?: SchoolYearResponse;

	@ApiProperty({ type: () => FederalStateResponse })
	federalState: FederalStateResponse;

	@ApiPropertyOptional()
	county?: CountyResponse;

	@ApiPropertyOptional()
	purpose?: SchoolPurpose;

	@ApiPropertyOptional()
	features?: SchoolFeatures[];

	@ApiPropertyOptional({ type: () => [SystemResponse] })
	systems?: SystemResponse[];

	@ApiProperty()
	inMaintenance?: boolean;
}

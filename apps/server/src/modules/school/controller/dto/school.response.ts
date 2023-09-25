import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SchoolFeatures, SchoolPurpose } from '../../domain';
import { CountyResponse } from './county.response';
import { FederalStateResponse } from './federal-state.response';
import { SchoolYearResponse } from './school-year.response';

export class SchoolResponse {
	constructor({ id, name, officialSchoolNumber, federalState, schoolYear, purpose, features, county }: SchoolResponse) {
		this.id = id;
		this.name = name;
		this.officialSchoolNumber = officialSchoolNumber;
		this.federalState = federalState;
		this.schoolYear = schoolYear;
		this.purpose = purpose;
		this.features = features;
		this.county = county;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	officialSchoolNumber?: string;

	@ApiProperty({ type: () => SchoolYearResponse })
	schoolYear?: SchoolYearResponse;

	@ApiProperty({ type: () => FederalStateResponse })
	federalState: FederalStateResponse;

	@ApiPropertyOptional()
	county?: CountyResponse;

	@ApiPropertyOptional()
	purpose?: SchoolPurpose;

	@ApiPropertyOptional()
	features?: SchoolFeatures[];
}

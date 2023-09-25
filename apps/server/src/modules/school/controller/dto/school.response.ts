import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SchoolFeatures, SchoolPurpose } from '../../domain';
import { FederalStateResponse } from './federal-state.response';
import { SchoolYearResponse } from './school-year.response';

export class SchoolResponse {
	constructor({ id, name, officialSchoolNumber, federalState, schoolYear, purpose, features }: SchoolResponse) {
		this.id = id;
		this.name = name;
		this.officialSchoolNumber = officialSchoolNumber;
		this.federalState = federalState;
		this.schoolYear = schoolYear;
		this.purpose = purpose;
		this.features = features;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	officialSchoolNumber?: string;

	@ApiProperty({ type: () => FederalStateResponse })
	federalState: FederalStateResponse;

	@ApiProperty({ type: () => SchoolYearResponse })
	schoolYear?: SchoolYearResponse;

	@ApiPropertyOptional()
	purpose?: SchoolPurpose;

	@ApiPropertyOptional()
	features?: SchoolFeatures[];
}

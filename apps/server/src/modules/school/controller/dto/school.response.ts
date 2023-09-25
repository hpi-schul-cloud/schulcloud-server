import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SchoolPurpose } from '../../domain';
import { FederalStateResponse } from './federal-state.response';
import { SchoolYearResponse } from './school-year.response';

export class SchoolResponse {
	constructor({ id, name, officialSchoolNumber, federalState, schoolYear, purpose }: SchoolResponse) {
		this.id = id;
		this.name = name;
		this.officialSchoolNumber = officialSchoolNumber;
		this.federalState = federalState;
		this.schoolYear = schoolYear;
		this.purpose = purpose;
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
}

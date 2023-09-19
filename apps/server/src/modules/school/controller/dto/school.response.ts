import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SchoolResponse {
	constructor({ name, officialSchoolNumber }: SchoolResponse) {
		this.name = name;
		this.officialSchoolNumber = officialSchoolNumber;
	}

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	officialSchoolNumber?: string;
}

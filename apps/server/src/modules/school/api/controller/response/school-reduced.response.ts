import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SchoolPurpose } from '../../../domain';

export class SlimSchoolResponse {
	constructor({ id, name, purpose }: SlimSchoolResponse) {
		this.id = id;
		this.name = name;
		this.purpose = purpose;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	purpose?: SchoolPurpose;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SchoolPurpose } from '../../../domain';

export class SchoolForExternalInviteResponse {
	constructor({ id, name, purpose }: SchoolForExternalInviteResponse) {
		this.id = id;
		this.name = name;
		this.purpose = purpose;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional({ enum: SchoolPurpose, enumName: 'SchoolPurpose' })
	purpose?: SchoolPurpose;
}

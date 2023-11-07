import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SchoolPurpose } from '../../../domain';

export class SchoolForExternalInviteResponse {
	constructor(props: SchoolForExternalInviteResponse) {
		this.id = props.id;
		this.name = props.name;
		this.purpose = props.purpose;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional({ enum: SchoolPurpose, enumName: 'SchoolPurpose' })
	purpose?: SchoolPurpose;
}

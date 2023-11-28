import { ApiProperty } from '@nestjs/swagger';

export class SchoolForExternalInviteResponse {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	name!: string;
}

import { ApiProperty } from '@nestjs/swagger';

export class SchoolInfoResponse {
	@ApiProperty({
		pattern: '[a-f0-9]{24}',
		description: 'The id of the School entity',
	})
	id: string;

	@ApiProperty({
		description: 'The name of the School entity',
	})
	name: string;
}

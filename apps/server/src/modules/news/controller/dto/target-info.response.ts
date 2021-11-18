import { ApiProperty } from '@nestjs/swagger';

export class TargetInfoResponse {
	@ApiProperty({
		pattern: '[a-f0-9]{24}',
		description: 'The id of the Target entity',
	})
	id: string;

	@ApiProperty({
		description: 'The name of the Target entity',
	})
	name: string;
}

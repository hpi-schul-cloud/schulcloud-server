import { ApiProperty } from '@nestjs/swagger';

export class TargetInfoResponse {
	constructor({ id, name }: TargetInfoResponse) {
		this.id = id;
		this.name = name;
	}

	@ApiProperty({
		pattern: '[a-f0-9]{24}',
		description: 'The id of the Target entity',
	})
	id!: string;

	@ApiProperty({
		description: 'The name of the Target entity',
	})
	name!: string;
}

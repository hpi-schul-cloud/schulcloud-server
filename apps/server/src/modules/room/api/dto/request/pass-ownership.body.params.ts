import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class PassOwnershipBodyParams {
	@ApiProperty({
		description: 'The IDs of the users',
		required: true,
	})
	@IsMongoId()
	public userId!: string;
}

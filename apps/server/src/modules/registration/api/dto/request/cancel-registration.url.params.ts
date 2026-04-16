import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CancelRegistrationUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of a room that should get detached from the registration.',
		required: true,
		nullable: false,
	})
	public roomId!: string;
}

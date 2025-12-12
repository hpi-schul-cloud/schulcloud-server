import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CancelRegistrationUrlParams {
	@IsMongoId()
	@ApiProperty({ description: 'The id of the registration the room is attached to.', required: true, nullable: false })
	public registrationId!: string;

	@IsMongoId()
	@ApiProperty({
		description: 'The id of a room that should get detached from the registration.',
		required: true,
		nullable: false,
	})
	public roomId!: string;
}

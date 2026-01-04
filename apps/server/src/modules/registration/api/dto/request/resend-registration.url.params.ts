import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class ResendRegistrationUrlParams {
	@IsMongoId()
	@ApiProperty({ description: 'The id of the registration the room is attached to.', required: true, nullable: false })
	public registrationId!: string;

	@IsMongoId()
	@ApiProperty({
		description: 'The id of a room that the registration is associated with.',
		required: true,
		nullable: false,
	})
	public roomId!: string;
}

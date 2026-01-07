import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId } from 'class-validator';

export class CancelRegistrationBodyParams {
	@ApiProperty({
		description: 'The registration ids the room is attached to',
		required: true,
	})
	@IsArray()
	@IsMongoId({ each: true })
	public registrationIds!: string[];
}

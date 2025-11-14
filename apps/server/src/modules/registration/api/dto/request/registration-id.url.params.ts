import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class RegistrationIdUrlParams {
	@IsMongoId()
	@ApiProperty({ description: 'The id of the registration.', required: true, nullable: false })
	public registrationId!: string;
}

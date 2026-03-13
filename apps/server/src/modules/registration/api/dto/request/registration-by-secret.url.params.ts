import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RegistrationBySecretUrlParams {
	@IsString()
	@ApiProperty({ description: 'The secret of the registration.', required: true, nullable: false })
	public registrationSecret!: string;
}

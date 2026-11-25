import { ApiProperty } from '@nestjs/swagger';
import { PrivacyProtect } from '@shared/controller/validator';
import { IsString } from 'class-validator';

export class RegistrationBySecretUrlParams {
	@PrivacyProtect()
	@IsString()
	@ApiProperty({ description: 'The secret of the registration.', required: true, nullable: false })
	registrationSecret!: string;
}

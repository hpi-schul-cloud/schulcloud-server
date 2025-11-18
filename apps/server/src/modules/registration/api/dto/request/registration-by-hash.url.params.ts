import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RegistrationByHashUrlParams {
	@IsString()
	@ApiProperty({ description: 'The hash of the registration.', required: true, nullable: false })
	public registrationHash!: string;
}

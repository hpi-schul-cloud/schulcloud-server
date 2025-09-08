import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForceMigrationParams {
	@IsEmail()
	@ApiProperty({ description: 'Email of the administrator' })
	email!: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: 'Target externalId to link it with an external account' })
	externalUserId!: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: 'Target externalId to link it with an external school' })
	externalSchoolId!: string;

	@IsBoolean()
	@IsNotEmpty()
	@ApiProperty({ description: 'Should extended mode be used' })
	forceExtendedMode!: boolean;
}

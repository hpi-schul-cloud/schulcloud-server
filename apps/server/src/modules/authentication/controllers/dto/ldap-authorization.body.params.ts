import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class LdapAuthorizationBodyParams {
	@IsMongoId()
	@ApiProperty()
	systemId!: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	username!: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	password!: string;

	@IsMongoId()
	@ApiProperty()
	schoolId!: string;
}

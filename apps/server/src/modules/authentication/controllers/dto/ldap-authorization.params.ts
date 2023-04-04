import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';

export class LdapAuthorizationParams {
	@IsMongoId()
	@ApiProperty()
	systemId!: string;

	@IsString()
	@ApiProperty()
	username!: string;

	@IsString()
	@ApiProperty()
	password!: string;

	@IsMongoId()
	@ApiProperty()
	schoolId!: string;
}

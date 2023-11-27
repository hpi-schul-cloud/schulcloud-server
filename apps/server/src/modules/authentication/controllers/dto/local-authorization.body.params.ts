import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LocalAuthorizationBodyParams {
	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	username!: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	password!: string;
}

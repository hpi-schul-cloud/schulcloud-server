import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class OidcLogoutBodyParams {
	@IsString()
	@ApiProperty()
	logout_token!: string;
}

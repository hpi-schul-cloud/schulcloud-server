import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RevokeConsentParams {
	@IsString()
	@ApiProperty({ description: 'The Oauth2 client id.', required: true, nullable: false })
	client!: string;
}

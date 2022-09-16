import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RevokeConsentQuery {
	@IsString()
	@ApiProperty({ description: 'The Oauth2 client id.', required: true, nullable: false })
	client!: string;
}

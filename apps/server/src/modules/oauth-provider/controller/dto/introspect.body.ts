import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IntrospectBody {
	@IsString()
	@ApiProperty({
		description:
			'The string value of the token. For access tokens, this is the "access_token" value returned from the token endpoint defined in OAuth 2.0. For refresh tokens, this is the "refresh_token" value returned.',
		required: true,
		nullable: false,
	})
	token!: string;
}

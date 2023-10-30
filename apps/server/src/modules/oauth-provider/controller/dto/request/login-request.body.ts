import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';
import { OAuthRejectableBody } from './oauth-rejectable.body';

export class LoginRequestBody extends OAuthRejectableBody {
	@IsBoolean()
	@IsOptional()
	@ApiProperty({
		description:
			'Remember, if set to true, tells the oauth provider to remember this consent authorization and reuse it if the same client asks the same user for the same, or a subset of, scope.',
		required: false,
		nullable: false,
	})
	remember?: boolean;

	@IsInt()
	@IsOptional()
	@ApiProperty({
		description:
			'RememberFor sets how long the consent authorization should be remembered for in seconds. If set to 0, the authorization will be remembered indefinitely.',
		required: false,
		nullable: false,
	})
	remember_for?: number;
}

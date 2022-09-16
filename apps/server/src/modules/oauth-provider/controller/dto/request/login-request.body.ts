import { IsBoolean, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestBody {
	@IsBoolean()
	@ApiProperty({
		description:
			'Remember, if set to true, tells the oauth provider to remember this consent authorization and reuse it if the same client asks the same user for the same, or a subset of, scope.',
		required: false,
		nullable: false,
	})
	remember?: boolean;

	@IsInt()
	@ApiProperty({
		description:
			'RememberFor sets how long the consent authorization should be remembered for in seconds. If set to 0, the authorization will be remembered indefinitely.',
		required: false,
		nullable: false,
	})
	remember_for?: number;
}

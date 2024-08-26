import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class OAuthRejectableBody {
	@IsString()
	@IsOptional()
	@ApiProperty({
		description:
			'The error should follow the OAuth2 error format (e.g. invalid_request, login_required). Defaults to request_denied.',
		required: false,
		nullable: false,
	})
	error?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({
		description:
			'Debug contains information to help resolve the problem as a developer. Usually not exposed to the public but only in the server logs.',
		required: false,
		nullable: false,
	})
	error_debug?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({
		description: 'Description of the error in a human readable format.',
		required: false,
		nullable: false,
	})
	error_description?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({
		description: 'Hint to help resolve the error.',
		required: false,
		nullable: false,
	})
	error_hint?: string;

	@IsNumber()
	@IsOptional()
	@ApiProperty({
		description: 'Represents the HTTP status code of the error (e.g. 401 or 403). Defaults to 400.',
		required: false,
		nullable: false,
	})
	status_code?: number;
}

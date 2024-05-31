import { ValidationPipe, ValidationError } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

export class WsValidationPipe extends ValidationPipe {
	constructor() {
		super({
			// enable DTO instance creation for incoming data
			transform: true,
			transformOptions: {
				// enable type coersion, requires transform:true
				enableImplicitConversion: true,
			},
			whitelist: true, // only pass valid @ApiProperty-decorated DTO properties, remove others
			forbidNonWhitelisted: false, // additional params are just skipped (required when extracting multiple DTO from single query)
			forbidUnknownValues: true,
			exceptionFactory: (errors: ValidationError[]) => new WsException(errors),
			validationError: {
				// make sure target (DTO) is set on validation error
				// we need this to be able to get DTO metadata for checking if a value has to be the obfuscated on output
				// see e.g. ErrorLoggable
				target: true,
				value: true,
			},
		});
	}
}

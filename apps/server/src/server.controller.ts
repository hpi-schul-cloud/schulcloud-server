import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { ForbiddenOperationError } from '@shared/common';
import { IsEnum } from 'class-validator';

enum ErrorTypes {
	NEST_NOT_FOUND_OBJ = 'NEST_NOT_FOUND_OBJ',
	NEST_NOT_FOUND_STR = 'NEST_NOT_FOUND_STR',
	BUSINESS_ERROR = 'BUSINESS_ERROR',
}

export class ErrorTypeParams {
	@ApiProperty({ enum: ErrorTypes })
	@IsEnum(ErrorTypes)
	type!: ErrorTypes;
}
@Controller()
export class ServerController {
	/** default route to test public access */
	@Get()
	getHello(): string {
		return 'Schulcloud Server API';
	}

	@Get('/:type')
	getError(@Param() params: ErrorTypeParams) {
		const { type } = params;
		const error = {
			message: ErrorTypes.NEST_NOT_FOUND_OBJ,
			title: 'OKK',
			test1: 'ddd',
			test2: 'ccc',
			test3: {
				test: 'test',
			},
		};
		if (type === ErrorTypes.NEST_NOT_FOUND_STR) {
			throw new NotFoundException(ErrorTypes.NEST_NOT_FOUND_STR);
		}
		if (type === ErrorTypes.NEST_NOT_FOUND_OBJ) {
			throw new NotFoundException(error);
		}
		if (type === ErrorTypes.BUSINESS_ERROR) {
			throw new ForbiddenOperationError(ErrorTypes.BUSINESS_ERROR, error);
		}
	}
}

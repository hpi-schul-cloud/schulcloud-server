import { IError } from '@infra/rabbitmq';
import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	InternalServerErrorException,
} from '@nestjs/common';
import _ from 'lodash';
import { ErrorMapper } from './error.mapper';

describe('ErrorMapper', () => {
	describe('mapErrorToDomainError', () => {
		it('Should map any 400 error to BadRequestException.', () => {
			const errorText = 'BadRequestException ABC';
			const e = new BadRequestException(errorText);
			const json = _.toPlainObject(e) as IError;

			const result = ErrorMapper.mapRpcErrorResponseToDomainError(json);

			expect(result).toStrictEqual(new BadRequestException(errorText));
		});

		it('Should map 403 error response to ForbiddenException.', () => {
			const errorText = 'ForbiddenException ABC';
			const rpcResponseError = _.toPlainObject(new ForbiddenException(errorText)) as IError;

			const result = ErrorMapper.mapRpcErrorResponseToDomainError(rpcResponseError);

			expect(result).toStrictEqual(new ForbiddenException(errorText));
		});

		it('Should map 500 error response to InternalServerErrorException.', () => {
			const errorText = 'InternalServerErrorException ABC';
			const json = _.toPlainObject(new InternalServerErrorException(errorText)) as IError;

			const result = ErrorMapper.mapRpcErrorResponseToDomainError(json);

			expect(result).toStrictEqual(new InternalServerErrorException(errorText));
		});

		it('Should map unknown error code to InternalServerErrorException.', () => {
			const errorText = 'Any error text';
			const json = _.toPlainObject(new ConflictException(errorText)) as IError;

			const result = ErrorMapper.mapRpcErrorResponseToDomainError(json);

			expect(result).toStrictEqual(new InternalServerErrorException('Internal Server Error Exception'));
			// @ts-expect-error cause is always unknown
			expect(result.cause?.message).toContain(errorText);
		});
	});
});

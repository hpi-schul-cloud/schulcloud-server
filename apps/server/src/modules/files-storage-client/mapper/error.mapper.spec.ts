import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	InternalServerErrorException,
	ValidationError as IValidationError,
} from '@nestjs/common';
import { ApiValidationError } from '@shared/common';
import _ from 'lodash';
import { IFileStorageError } from '../interfaces';
import { ErrorMapper } from './error.mapper';

describe('ErrorMapper', () => {
	const createApiValidationError = (): ApiValidationError => {
		const constraints: IValidationError[] = [];
		constraints.push(
			{
				property: 'propWithoutConstraint',
			},
			{
				property: 'propWithOneConstraing',
				constraints: {
					rulename: 'ruleDescription',
				},
			},
			{
				property: 'propWithMultipleCOnstraints',
				constraints: {
					rulename: 'ruleDescription',
					secondrulename: 'secondRuleDescription',
				},
			}
		);

		const apiValidationError = new ApiValidationError(constraints);

		return apiValidationError;
	};

	describe('mapErrorToDomainError', () => {
		it('Should map 403 error response to ForbiddenException.', () => {
			const errorText = 'ForbiddenException ABC';
			const json = _.toPlainObject(new ForbiddenException(errorText)) as IFileStorageError;
			const result = ErrorMapper.mapErrorToDomainError(json);

			expect(result).toStrictEqual(new ForbiddenException(errorText));
		});

		it('Should map 500 error response to InternalServerErrorException.', () => {
			const errorText = 'InternalServerErrorException ABC';
			const json = _.toPlainObject(new InternalServerErrorException(errorText)) as IFileStorageError;

			const result = ErrorMapper.mapErrorToDomainError(json);

			expect(result).toStrictEqual(new InternalServerErrorException());
		});

		it('Should map unknown error code to InternalServerErrorException.', () => {
			const errorText = 'ForbiddenException ABC';
			const json = _.toPlainObject(new ConflictException(errorText)) as IFileStorageError;
			const result = ErrorMapper.mapErrorToDomainError(json);

			const a = new InternalServerErrorException();
			console.log(a.message);

			expect(result).toStrictEqual(a.name);
		});

		it('Should map generic error to InternalServerErrorException.', () => {
			const errorText = 'ABC';
			const error = new Error(errorText) as IFileStorageError;
			const result = ErrorMapper.mapErrorToDomainError(error);

			expect(result).toStrictEqual(new InternalServerErrorException());
		});

		it('Should map 400 api validation error response to ApiValidationError.', () => {
			const apiValidationError = createApiValidationError();
			const json = _.toPlainObject(apiValidationError) as IFileStorageError;

			const result = ErrorMapper.mapErrorToDomainError(json);

			expect(result).toStrictEqual(new ApiValidationError());
		});

		it('Should map any 400 error that is not an ApiValidationError to InternalServerErrorException.', () => {
			const errorText = 'ForbiddenException ABC';
			const e = new BadRequestException(errorText);
			const json = _.toPlainObject(e) as IFileStorageError;
			const result = ErrorMapper.mapErrorToDomainError(json);

			expect(result).toStrictEqual(new BadRequestException(errorText));
		});
	});
});

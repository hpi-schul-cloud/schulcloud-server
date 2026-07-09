import { HttpStatus, type ValidationError } from '@nestjs/common';
import { ApiValidationError } from '@shared/common/error';
import { ApiValidationErrorResponseFactory } from './api-validation-error-response.factory';

describe('ApiValidationErrorResponseFactory', () => {
	describe('fromApiValidationError', () => {
		it('should map error metadata to the response', () => {
			const error = new ApiValidationError([]);

			const result = ApiValidationErrorResponseFactory.fromApiValidationError(error);

			expect(result).toMatchObject({
				type: 'API_VALIDATION_ERROR',
				title: 'API Validation Error',
				message: 'API validation failed, see validationErrors for details',
				code: HttpStatus.BAD_REQUEST,
			});
		});

		it('should return an empty validationErrors array when there are no validation errors', () => {
			const error = new ApiValidationError([]);

			const result = ApiValidationErrorResponseFactory.fromApiValidationError(error);

			expect(result.validationErrors).toEqual([]);
		});

		it('should map a flat validation error with constraints', () => {
			const validationErrors: ValidationError[] = [
				{
					property: 'email',
					constraints: { isEmail: 'email must be an email', isNotEmpty: 'email must not be empty' },
				},
			];
			const error = new ApiValidationError(validationErrors);

			const result = ApiValidationErrorResponseFactory.fromApiValidationError(error);

			expect(result.validationErrors).toEqual([
				{ field: ['email'], errors: ['email must be an email', 'email must not be empty'] },
			]);
		});

		it('should collect parent and child constraints independently', () => {
			const validationErrors: ValidationError[] = [
				{
					property: 'parent',
					constraints: { isNotEmpty: 'parent must not be empty' },
					children: [
						{
							property: 'child',
							constraints: { isString: 'child must be a string' },
							children: [],
						},
					],
				},
			];
			const error = new ApiValidationError(validationErrors);

			const result = ApiValidationErrorResponseFactory.fromApiValidationError(error);

			expect(result.validationErrors).toEqual([
				{ field: ['parent'], errors: ['parent must not be empty'] },
				{ field: ['parent', 'child'], errors: ['child must be a string'] },
			]);
		});

		it('should build the full property path for deeply nested errors', () => {
			const validationErrors: ValidationError[] = [
				{
					property: 'level1',
					children: [
						{
							property: 'level2',
							children: [
								{
									property: 'level3',
									constraints: { isDefined: 'level3 must be defined' },
								},
							],
						},
					],
				},
			];
			const error = new ApiValidationError(validationErrors);

			const result = ApiValidationErrorResponseFactory.fromApiValidationError(error);

			expect(result.validationErrors).toEqual([
				{ field: ['level1', 'level2', 'level3'], errors: ['level3 must be defined'] },
			]);
		});

		it('should handle array index segments in the property path', () => {
			const validationErrors: ValidationError[] = [
				{
					property: 'items',
					children: [
						{
							property: '0',
							children: [{ property: 'name', constraints: { isString: 'name must be a string' } }],
						},
					],
				},
			];
			const error = new ApiValidationError(validationErrors);

			const result = ApiValidationErrorResponseFactory.fromApiValidationError(error);

			expect(result.validationErrors).toEqual([{ field: ['items', '0', 'name'], errors: ['name must be a string'] }]);
		});

		it('should omit undefined property names from the path (polymorphic discriminator case)', () => {
			const validationErrors: ValidationError[] = [
				{
					property: 'parent',
					children: [
						{
							property: undefined as unknown as string,
							constraints: { errorConstraint: 'errorText' },
						},
					],
				},
			];
			const error = new ApiValidationError(validationErrors);

			const result = ApiValidationErrorResponseFactory.fromApiValidationError(error);

			expect(result.validationErrors).toEqual([{ field: ['parent'], errors: ['errorText'] }]);
		});

		it('should handle multiple top-level errors and collect all nested errors', () => {
			const validationErrors: ValidationError[] = [
				{
					property: 'field1',
					constraints: { errorConstraint1: 'errorText1', errorConstraint2: 'errorText2' },
					children: [{ property: 'nested1', constraints: { errorConstraint: 'errorText3' }, children: [] }],
				},
				{
					property: 'field2',
					children: [
						{
							property: '0',
							children: [{ property: 'deepField', constraints: { errorConstraint: 'errorText4' } }],
						},
					],
				},
				{
					property: 'field3',
					children: [
						{
							property: undefined as unknown as string,
							constraints: { errorConstraint: 'errorText5' },
						},
					],
				},
			];
			const error = new ApiValidationError(validationErrors);

			const result = ApiValidationErrorResponseFactory.fromApiValidationError(error);

			expect(result.validationErrors).toEqual([
				{ field: ['field1'], errors: ['errorText1', 'errorText2'] },
				{ field: ['field1', 'nested1'], errors: ['errorText3'] },
				{ field: ['field2', '0', 'deepField'], errors: ['errorText4'] },
				{ field: ['field3'], errors: ['errorText5'] },
			]);
		});
	});
});

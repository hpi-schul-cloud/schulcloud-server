import { HttpStatus, ValidationError } from '@nestjs/common';
import { ApiValidationError } from '@shared/common/error';
import { ApiValidationErrorResponse } from './api-validation-error.response';

describe('ApiValidationErrorResponse', () => {
	describe('when creating an api validation error response', () => {
		it('should have error code and response', () => {
			const error = new ApiValidationError();
			const errorDto = new ApiValidationErrorResponse(error);
			expect(errorDto.code).toEqual(HttpStatus.BAD_REQUEST);
			expect(errorDto.code).toEqual(400);
			expect(errorDto.title).toEqual('API Validation Error');
			expect(errorDto.type).toEqual('API_VALIDATION_ERROR');
			expect(errorDto.message).toEqual('API validation failed, see validationErrors for details');
			const { validationErrors } = errorDto;
			expect(validationErrors).toEqual([]);
		});

		it('should have validation errors given', () => {
			const constraints: ValidationError[] = [];
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
			const error = new ApiValidationError(constraints);
			const errorDto = new ApiValidationErrorResponse(error);
			const { validationErrors } = errorDto;
			expect(validationErrors.length).toEqual(3);
			expect(validationErrors).toContainEqual({
				field: 'propWithoutConstraint',
				errors: ['validation failed'],
			});
			expect(validationErrors).toContainEqual({
				field: 'propWithOneConstraing',
				errors: ['ruleDescription'],
			});
			expect(validationErrors).toContainEqual({
				field: 'propWithMultipleCOnstraints',
				errors: ['ruleDescription', 'secondRuleDescription'],
			});
		});
	});
});

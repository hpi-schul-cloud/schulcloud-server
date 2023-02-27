import { HttpStatus, ValidationError } from '@nestjs/common';
import { ApiValidationError } from '@shared/common/error';
import { ApiValidationErrorResponse } from './api-validation-error.response';

describe('ApiValidationErrorResponse', () => {
	describe('when creating an api validation error response', () => {
		it('should create a response with http status 400 and a list of validation errors', () => {
			const validationErrors: ValidationError[] = [
				{
					property: 'parentFieldName1',
					constraints: { errorConstraint1: 'errorText1', errorConstraint2: 'errorText2' },
					children: [
						{
							property: 'childFieldName1',
							constraints: { errorConstraint: 'errorText3' },
							children: [],
						},
					],
				},
				{
					property: 'parentFieldName2',
					children: [
						{
							property: '0',
							children: [
								{
									property: 'childArrayItem',
									constraints: { errorConstraint: 'errorText4' },
								},
							],
						},
					],
				},
				{
					property: 'parentFieldName3',
					children: [
						{
							// property name can be undefined when using polymorphic types (discriminator)
							property: undefined as unknown as string,
							constraints: { errorConstraint: 'errorText5' },
						},
					],
				},
			];
			const error = new ApiValidationError(validationErrors);

			const errorDto = new ApiValidationErrorResponse(error);

			expect(errorDto).toEqual({
				type: 'API_VALIDATION_ERROR',
				title: 'API Validation Error',
				message: 'API validation failed, see validationErrors for details',
				code: HttpStatus.BAD_REQUEST,
				validationErrors: [
					{
						field: ['parentFieldName1'],
						errors: ['errorText1', 'errorText2'],
					},
					{
						field: ['parentFieldName1', 'childFieldName1'],
						errors: ['errorText3'],
					},
					{
						field: ['parentFieldName2', '0', 'childArrayItem'],
						errors: ['errorText4'],
					},
					{
						field: ['parentFieldName3'],
						errors: ['errorText5'],
					},
				],
			});
		});
	});
});

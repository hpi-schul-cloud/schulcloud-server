import { ValidationErrorDetailResponse } from './validation-error-detail.response';

describe('ValidationErrorDetailResponse', () => {
	describe('when creating a ValidationErrorDetailResponse instance', () => {
		it('should have field and errors defined', () => {
			const dto = new ValidationErrorDetailResponse('property', ['an error message']);
			expect(dto.field).toEqual('property');
			expect(dto.errors).toEqual(['an error message']);
		});
	});
});

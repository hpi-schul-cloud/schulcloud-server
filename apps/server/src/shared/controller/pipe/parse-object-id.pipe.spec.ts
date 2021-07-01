import { ObjectId } from '@mikro-orm/mongodb';
import { BadRequestException } from '@nestjs/common';
import { ParseObjectIdPipe } from '.';

describe('ParseObjectIdPipe', () => {
	describe('when parsing a string value', () => {
		const pipe = new ParseObjectIdPipe();
		it('should pass valid generated id', () => {
			const validId = new ObjectId().toHexString();
			pipe.transform(validId);
		});
		it('should pass valid id', () => {
			const validId = '60c85f7f77e64d0a4686e86f';
			pipe.transform(validId);
		});
		it('should not pass invalid id', () => {
			const invalidId = '60c85f7f77e64d0a4686e86';
			expect(() => pipe.transform(invalidId)).toThrow(BadRequestException);
		});
		it('should not pass invalid id', () => {
			const invalidId = 'abcd';
			expect(() => pipe.transform(invalidId)).toThrow(BadRequestException);
		});
		it('should not pass numbers', () => {
			const invalidId = '123';
			expect(() => pipe.transform(invalidId)).toThrow(BadRequestException);
		});
	});
});

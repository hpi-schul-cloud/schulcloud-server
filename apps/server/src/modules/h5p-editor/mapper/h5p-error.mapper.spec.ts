import { H5pError } from '@lumieducation/h5p-server';
import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { H5PErrorMapper } from './h5p-error.mapper';

describe('H5PErrorMapper', () => {
	let h5pErrorMapper: H5PErrorMapper;

	beforeEach(async () => {
		const app: TestingModule = await Test.createTestingModule({
			providers: [H5PErrorMapper],
		}).compile();

		h5pErrorMapper = app.get<H5PErrorMapper>(H5PErrorMapper);
	});

	describe('mapH5pError', () => {
		it('should map H5pError to HttpException', () => {
			const error = new H5pError('h5p error massage');
			const result = h5pErrorMapper.mapH5pError(error);

			expect(result).toBeInstanceOf(HttpException);
			expect(result.message).toEqual('h5p error massage');
		});
	});
});

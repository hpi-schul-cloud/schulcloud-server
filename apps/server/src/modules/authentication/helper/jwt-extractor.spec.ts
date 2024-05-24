import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Request } from 'express';
import { JwtFromRequestFunction } from 'passport-jwt';
import { JwtExtractor } from './jwt-extractor';

describe('JwtExtractor', () => {
	let request: DeepMocked<Request>;
	beforeEach(() => {
		request = createMock<Request>();
	});

	describe('fromCookie extractor', () => {
		let extractor: JwtFromRequestFunction;

		beforeEach(() => {
			extractor = JwtExtractor.fromCookie('jwt');
		});

		it('should return an extractor', () => {
			expect(extractor).toBeDefined();
		});

		it('should return the token if exists in cookie', () => {
			request.headers.cookie = 'jwt=08154711';
			expect(extractor(request)).toEqual('08154711');
		});

		it('should return null if the cookie attribute name does not match', () => {
			request.headers.cookie = 'token=08154711';
			expect(extractor(request)).toEqual(null);
		});

		it('should return null if no cookies exist', () => {
			expect(extractor(request)).toEqual(null);
		});

		it('should return null for empty cookies', () => {
			request.headers.cookie = '';
			expect(extractor(request)).toEqual(null);
		});
	});
});

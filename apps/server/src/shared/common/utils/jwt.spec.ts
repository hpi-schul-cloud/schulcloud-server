import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtFromRequestFunction } from 'passport-jwt';
import { JwtExtractor } from './jwt';

describe('JwtExtractor', () => {
	let request: DeepMocked<Request>;

	beforeEach(() => {
		request = createMock<Request>();
	});

	beforeEach(() => {
		jest.clearAllMocks();
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

	describe('extractJwtFromRequest', () => {
		describe('when jwt is present in the request', () => {
			const setup = () => {
				const token = faker.string.alphanumeric(42);

				request.headers.authorization = `Bearer ${token}`;

				return token;
			};

			it('should return the jwt', () => {
				const token = setup();

				const result = JwtExtractor.extractJwtFromRequestOrFail(request);

				expect(result).toEqual(token);
			});
		});

		describe('when jwt is not present in the request', () => {
			const setup = () => {
				request.headers.authorization = undefined;
			};

			it('should throw an UnauthorizedException', () => {
				setup();

				expect(() => JwtExtractor.extractJwtFromRequestOrFail(request)).toThrow(UnauthorizedException);
			});
		});
	});
});

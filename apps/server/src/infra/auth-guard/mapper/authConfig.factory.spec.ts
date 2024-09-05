import { Algorithms, AuthConfigFactory, JwtConstants } from './authConfig.factory';

const buildNotAStringError = () => new Error(`Type is not a string`);
const buildNotAnObjectError = () => new Error(`Type is not an object.`);

describe('AuthConfigFactory.build', () => {
	describe('when input is valid', () => {
		const setup = () => {
			const secret = 'mysecret';
			const input = {
				audience: 'myaudience',
				issuer: 'myissuer',
				expiresIn: '1h',
			};
			const expectedResult: JwtConstants = {
				secret: 'mysecret',
				jwtOptions: {
					header: { typ: 'access' },
					audience: 'myaudience',
					issuer: 'myissuer',
					algorithm: Algorithms.HS256,
					expiresIn: '1h',
				},
			};

			return { secret, input, expectedResult };
		};

		it('should map input to JwtConstants', () => {
			const { secret, input, expectedResult } = setup();

			const result: JwtConstants = AuthConfigFactory.build(secret, input);

			expect(result).toEqual(expectedResult);
		});
	});

	describe('when input is null', () => {
		const setup = () => {
			const secret = 'mysecret';
			const input = null;
			const error = buildNotAnObjectError();

			return { secret, input, error };
		};

		it('should throw', () => {
			const { secret, input, error } = setup();

			expect(() => AuthConfigFactory.build(secret, input)).toThrow(error);
		});
	});

	describe('when input is undefined', () => {
		const setup = () => {
			const secret = 'mysecret';
			const input = undefined;
			const error = buildNotAnObjectError();

			return { secret, input, error };
		};

		it('should throw', () => {
			const { secret, input, error } = setup();

			expect(() => AuthConfigFactory.build(secret, input)).toThrow(error);
		});
	});

	describe('when secret prop is unedfined', () => {
		const setup = () => {
			const secret = undefined;
			const jwtOptions = {
				audience: 'myaudience',
				issuer: 'myissuer',
				expiresIn: '1h',
			};
			const error = new Error('Object has no secret.');

			return { secret, jwtOptions, error };
		};

		it('should throw', () => {
			const { secret, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(secret, jwtOptions)).toThrow(error);
		});
	});

	describe('when secret prop is number', () => {
		const setup = () => {
			const secret = 123;
			const jwtOptions = {
				audience: 'myaudience',
				issuer: 'myissuer',
				expiresIn: '1h',
			};
			const error = buildNotAStringError();

			return { secret, jwtOptions, error };
		};

		it('should throw', () => {
			const { secret, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(secret, jwtOptions)).toThrow(error);
		});
	});

	describe('when jwtOptions is unedfined', () => {
		const setup = () => {
			const secret = 'mysecret';
			const jwtOptions = undefined;
			const error = new Error('Object has no jwtOptions.');

			return { secret, jwtOptions, error };
		};

		it('should throw', () => {
			const { secret, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(secret, jwtOptions)).toThrow(error);
		});
	});

	describe('when audience prop is undefined', () => {
		const setup = () => {
			const secret = 'mysecret';
			const jwtOptions = {
				issuer: 'myissuer',
				expiresIn: '1h',
			};
			const error = new Error('Object has no audience.');

			return { secret, jwtOptions, error };
		};

		it('should throw', () => {
			const { secret, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(secret, jwtOptions)).toThrow(error);
		});
	});

	describe('when audience prop is number', () => {
		const setup = () => {
			const secret = 'mysecret';
			const jwtOptions = {
				audience: 123,
				issuer: 'myissuer',
				expiresIn: '1h',
			};
			const error = buildNotAStringError();

			return { secret, jwtOptions, error };
		};

		it('should throw', () => {
			const { secret, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(secret, jwtOptions)).toThrow(error);
		});
	});

	describe('when issuer prop is undefined', () => {
		const setup = () => {
			const secret = 'mysecret';
			const jwtOptions = {
				audience: 'myaudience',
				issuer: 'myissuer',
				expiresIn: '1h',
			};
			const error = new Error('Object has no issuer.');

			return { secret, jwtOptions, error };
		};

		it('should throw', () => {
			const { secret, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(secret, jwtOptions)).toThrow(error);
		});
	});

	describe('when issuer prop is number', () => {
		const setup = () => {
			const secret = 'mysecret';
			const jwtOptions = {
				audience: 'myaudience',
				issuer: 123,
				expiresIn: '1h',
			};
			const error = buildNotAStringError();

			return { secret, jwtOptions, error };
		};

		it('should throw', () => {
			const { secret, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(secret, jwtOptions)).toThrow(error);
		});
	});

	describe('when expiresIn prop is undefined', () => {
		const setup = () => {
			const secret = 'mysecret';
			const jwtOptions = {
				audience: 'myaudience',
				issuer: 'myissuer',
			};
			const error = new Error('Object has no expiresIn.');

			return { secret, jwtOptions, error };
		};

		it('should throw', () => {
			const { secret, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(secret, jwtOptions)).toThrow(error);
		});
	});

	describe('when expiresIn prop is number', () => {
		const setup = () => {
			const secret = 'mysecret';
			const jwtOptions = {
				audience: 'myaudience',
				issuer: 'myissuer',
				expiresIn: 123,
			};
			const error = buildNotAStringError();

			return { secret, jwtOptions, error };
		};

		it('should throw', () => {
			const { secret, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(secret, jwtOptions)).toThrow(error);
		});
	});
});

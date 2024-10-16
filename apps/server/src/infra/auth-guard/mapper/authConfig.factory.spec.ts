import { Algorithms, AuthConfigFactory, JwtConstants } from './authConfig.factory';

const buildNotAStringError = () => new Error(`Type is not a string`);
const buildNotAnObjectError = () => new Error(`Type is not an object.`);

describe('AuthConfigFactory.build', () => {
	describe('when input is valid', () => {
		const setup = () => {
			const privateKey = 'myprivatekey';
			const publicKey = 'mypublickey';
			const jwtOptions = {
				audience: 'myaudience',
				issuer: 'myissuer',
				expiresIn: '1h',
			};
			const expectedResult: JwtConstants = {
				privateKey: 'myprivatekey',
				publicKey: 'mypublickey',
				jwtOptions: {
					header: { typ: 'JWT' },
					audience: 'myaudience',
					issuer: 'myissuer',
					algorithm: Algorithms.RS256,
					expiresIn: '1h',
				},
			};

			return { privateKey, publicKey, jwtOptions, expectedResult };
		};

		it('should map input to JwtConstants', () => {
			const { privateKey, publicKey, jwtOptions, expectedResult } = setup();

			const result: JwtConstants = AuthConfigFactory.build(privateKey, publicKey, jwtOptions);

			expect(result).toEqual(expectedResult);
		});
	});

	describe('when privateKey is undefined', () => {
		const setup = () => {
			const privateKey = undefined;
			const publicKey = 'mypublickey';
			const jwtOptions = {
				audience: 'myaudience',
				issuer: 'myissuer',
				expiresIn: '1h',
			};
			const error = buildNotAStringError();

			return { privateKey, publicKey, jwtOptions, error };
		};

		it('should throw', () => {
			const { privateKey, publicKey, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(privateKey, publicKey, jwtOptions)).toThrow(error);
		});
	});

	describe('when privateKey is number', () => {
		const setup = () => {
			const privateKey = 123;
			const publicKey = 'mypublickey';
			const jwtOptions = {
				audience: 'myaudience',
				issuer: 'myissuer',
				expiresIn: '1h',
			};
			const error = buildNotAStringError();

			return { privateKey, publicKey, jwtOptions, error };
		};

		it('should throw', () => {
			const { privateKey, publicKey, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(privateKey, publicKey, jwtOptions)).toThrow(error);
		});
	});

	describe('when publicKey is undefined', () => {
		const setup = () => {
			const privateKey = 'myprivatekey';
			const publicKey = undefined;
			const jwtOptions = {
				audience: 'myaudience',
				issuer: 'myissuer',
				expiresIn: '1h',
			};
			const error = buildNotAStringError();

			return { privateKey, publicKey, jwtOptions, error };
		};

		it('should throw', () => {
			const { privateKey, publicKey, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(privateKey, publicKey, jwtOptions)).toThrow(error);
		});
	});

	describe('when publicKey is number', () => {
		const setup = () => {
			const privateKey = 'myprivatekey';
			const publicKey = 123;
			const jwtOptions = {
				audience: 'myaudience',
				issuer: 'myissuer',
				expiresIn: '1h',
			};
			const error = buildNotAStringError();

			return { privateKey, publicKey, jwtOptions, error };
		};

		it('should throw', () => {
			const { privateKey, publicKey, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(privateKey, publicKey, jwtOptions)).toThrow(error);
		});
	});

	describe('when jwtOptions is undefined', () => {
		const setup = () => {
			const privateKey = 'myprivatekey';
			const publicKey = 'mypublickey';
			const jwtOptions = undefined;
			const error = buildNotAnObjectError();

			return { privateKey, publicKey, jwtOptions, error };
		};

		it('should throw', () => {
			const { privateKey, publicKey, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(privateKey, publicKey, jwtOptions)).toThrow(error);
		});
	});

	describe('when audience prop is undefined', () => {
		const setup = () => {
			const privateKey = 'myprivatekey';
			const publicKey = 'mypublickey';
			const jwtOptions = {
				issuer: 'myissuer',
				expiresIn: '1h',
			};
			const error = new Error(
				'Object has missing key. Required are: ["audience","issuer","expiresIn"]. Get object keys: ["issuer","expiresIn"]'
			);

			return { privateKey, publicKey, jwtOptions, error };
		};

		it('should throw', () => {
			const { privateKey, publicKey, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(privateKey, publicKey, jwtOptions)).toThrow(error);
		});
	});

	describe('when audience prop is number', () => {
		const setup = () => {
			const privateKey = 'myprivatekey';
			const publicKey = 'mypublickey';
			const jwtOptions = {
				audience: 123,
				issuer: 'myissuer',
				expiresIn: '1h',
			};
			const error = buildNotAStringError();

			return { privateKey, publicKey, jwtOptions, error };
		};

		it('should throw', () => {
			const { privateKey, publicKey, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(privateKey, publicKey, jwtOptions)).toThrow(error);
		});
	});

	describe('when issuer prop is undefined', () => {
		const setup = () => {
			const privateKey = 'myprivatekey';
			const publicKey = 'mypublickey';
			const jwtOptions = {
				audience: 'myaudience',
				issuer: undefined,
				expiresIn: '1h',
			};
			const error = buildNotAStringError();

			return { privateKey, publicKey, jwtOptions, error };
		};

		it('should throw', () => {
			const { privateKey, publicKey, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(privateKey, publicKey, jwtOptions)).toThrow(error);
		});
	});

	describe('when issuer prop is number', () => {
		const setup = () => {
			const privateKey = 'myprivatekey';
			const publicKey = 'mypublickey';
			const jwtOptions = {
				audience: 'myaudience',
				issuer: 123,
				expiresIn: '1h',
			};
			const error = buildNotAStringError();

			return { privateKey, publicKey, jwtOptions, error };
		};

		it('should throw', () => {
			const { privateKey, publicKey, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(privateKey, publicKey, jwtOptions)).toThrow(error);
		});
	});

	describe('when expiresIn prop is undefined', () => {
		const setup = () => {
			const privateKey = 'myprivatekey';
			const publicKey = 'mypublickey';
			const jwtOptions = {
				audience: 'myaudience',
				issuer: 'myissuer',
			};
			const error = new Error(
				'Object has missing key. Required are: ["audience","issuer","expiresIn"]. Get object keys: ["audience","issuer"]'
			);

			return { privateKey, publicKey, jwtOptions, error };
		};

		it('should throw', () => {
			const { privateKey, publicKey, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(privateKey, publicKey, jwtOptions)).toThrow(error);
		});
	});

	describe('when expiresIn prop is number', () => {
		const setup = () => {
			const privateKey = 'myprivatekey';
			const publicKey = 'mypublickey';
			const jwtOptions = {
				audience: 'myaudience',
				issuer: 'myissuer',
				expiresIn: 123,
			};
			const error = buildNotAStringError();

			return { privateKey, publicKey, jwtOptions, error };
		};

		it('should throw', () => {
			const { privateKey, publicKey, jwtOptions, error } = setup();

			expect(() => AuthConfigFactory.build(privateKey, publicKey, jwtOptions)).toThrow(error);
		});
	});
});

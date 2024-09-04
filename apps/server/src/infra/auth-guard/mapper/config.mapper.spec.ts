import { AuthConfigFactory, JwtConstants } from './config.mapper';

const buildNotAStringError = () => new Error(`Type is not a string`);
const buildNotAnObjectError = () => new Error(`Type is not an object.`);

describe('mapFeathersAuthConfigToAuthConfig', () => {
	describe('when input is valid', () => {
		const setup = () => {
			const input = {
				secret: 'mysecret',
				jwtOptions: {
					header: { typ: 'JWT' },
					audience: 'myaudience',
					issuer: 'myissuer',
					algorithm: 'HS256',
					expiresIn: '1h',
				},
			};
			const expectedResult: JwtConstants = {
				secret: 'mysecret',
				jwtOptions: {
					header: { typ: 'JWT' },
					audience: 'myaudience',
					issuer: 'myissuer',
					algorithm: 'HS256',
					expiresIn: '1h',
				},
			};

			return { input, expectedResult };
		};

		it('should map input to JwtConstants', () => {
			const { input, expectedResult } = setup();

			const result: JwtConstants = AuthConfigFactory.build(input);

			expect(result).toEqual(expectedResult);
		});
	});

	describe('when input is null', () => {
		const setup = () => {
			const input = null;
			const error = buildNotAnObjectError();

			return { input, error };
		};

		it('should throw', () => {
			const { input, error } = setup();

			expect(() => AuthConfigFactory.build(input)).toThrow(error);
		});
	});

	describe('when input is undefined', () => {
		const setup = () => {
			const input = undefined;
			const error = buildNotAnObjectError();

			return { input, error };
		};

		it('should throw', () => {
			const { input, error } = setup();

			expect(() => AuthConfigFactory.build(input)).toThrow(error);
		});
	});

	describe('when secret prop is unedfined', () => {
		const setup = () => {
			const input = {
				authConfig: {
					jwtOptions: {
						header: { typ: 'JWT' },
						audience: 'myaudience',
						issuer: 'myissuer',
						algorithm: 'HS256',
						expiresIn: '1h',
					},
				},
			};
			const error = new Error('Object has no secret.');

			return { input, error };
		};

		it('should throw', () => {
			const { input, error } = setup();

			expect(() => AuthConfigFactory.build(input)).toThrow(error);
		});
	});

	describe('when secret prop is number', () => {
		const setup = () => {
			const input = {
				secret: 123,
				jwtOptions: {
					header: { typ: 'JWT' },
					audience: 'myaudience',
					issuer: 'myissuer',
					algorithm: 'HS256',
					expiresIn: '1h',
				},
			};
			const error = buildNotAStringError();

			return { input, error };
		};

		it('should throw', () => {
			const { input, error } = setup();

			expect(() => AuthConfigFactory.build(input)).toThrow(error);
		});
	});

	describe('when jwtOptions prop is unedfined', () => {
		const setup = () => {
			const input = {
				secret: 'mysecret',
			};
			const error = new Error('Object has no jwtOptions.');

			return { input, error };
		};

		it('should throw', () => {
			const { input, error } = setup();

			expect(() => AuthConfigFactory.build(input)).toThrow(error);
		});
	});

	describe('when header prop is undefined', () => {
		const setup = () => {
			const input = {
				secret: 'mysecret',
				jwtOptions: {
					audience: 'myaudience',
					issuer: 'myissuer',
					algorithm: 'HS256',
					expiresIn: '1h',
				},
			};
			const error = new Error('Object has no header.');

			return { input, error };
		};

		it('should throw', () => {
			const { input, error } = setup();

			expect(() => AuthConfigFactory.build(input)).toThrow(error);
		});
	});

	describe('when typ prop is undefined', () => {
		const setup = () => {
			const input = {
				secret: 'mysecret',
				jwtOptions: {
					header: {},
					audience: 'myaudience',
					issuer: 'myissuer',
					algorithm: 'HS256',
					expiresIn: '1h',
				},
			};
			const error = new Error('Object has no typ.');

			return { input, error };
		};

		it('should throw', () => {
			const { input, error } = setup();

			expect(() => AuthConfigFactory.build(input)).toThrow(error);
		});
	});

	describe('when typ prop is number', () => {
		const setup = () => {
			const input = {
				secret: 'mysecret',
				jwtOptions: {
					header: { typ: 123 },
					audience: 'myaudience',
					issuer: 'myissuer',
					algorithm: 'HS256',
					expiresIn: '1h',
				},
			};
			const error = buildNotAStringError();

			return { input, error };
		};

		it('should throw', () => {
			const { input, error } = setup();

			expect(() => AuthConfigFactory.build(input)).toThrow(error);
		});
	});

	describe('when audience prop is undefined', () => {
		const setup = () => {
			const input = {
				secret: 'mysecret',
				jwtOptions: {
					header: { typ: 'JWT' },
					issuer: 'myissuer',
					algorithm: 'HS256',
					expiresIn: '1h',
				},
			};
			const error = new Error('Object has no audience.');

			return { input, error };
		};

		it('should throw', () => {
			const { input, error } = setup();

			expect(() => AuthConfigFactory.build(input)).toThrow(error);
		});
	});

	describe('when audience prop is number', () => {
		const setup = () => {
			const input = {
				secret: 'mysecret',
				jwtOptions: {
					header: { typ: 'JWT' },
					audience: 123,
					issuer: 'myissuer',
					algorithm: 'HS256',
					expiresIn: '1h',
				},
			};
			const error = buildNotAStringError();

			return { input, error };
		};

		it('should throw', () => {
			const { input, error } = setup();

			expect(() => AuthConfigFactory.build(input)).toThrow(error);
		});
	});

	describe('when issuer prop is undefined', () => {
		const setup = () => {
			const input = {
				secret: 'mysecret',
				jwtOptions: {
					header: { typ: 'JWT' },
					audience: 'myaudience',
					algorithm: 'HS256',
					expiresIn: '1h',
				},
			};
			const error = new Error('Object has no issuer.');

			return { input, error };
		};

		it('should throw', () => {
			const { input, error } = setup();

			expect(() => AuthConfigFactory.build(input)).toThrow(error);
		});
	});

	describe('when issuer prop is number', () => {
		const setup = () => {
			const input = {
				secret: 'mysecret',
				jwtOptions: {
					header: { typ: 'JWT' },
					audience: 'myaudience',
					issuer: 123,
					algorithm: 'HS256',
					expiresIn: '1h',
				},
			};
			const error = buildNotAStringError();

			return { input, error };
		};

		it('should throw', () => {
			const { input, error } = setup();

			expect(() => AuthConfigFactory.build(input)).toThrow(error);
		});
	});

	describe('when algorithm prop is undefined', () => {
		const setup = () => {
			const input = {
				secret: 'mysecret',
				jwtOptions: {
					header: { typ: 'JWT' },
					audience: 'myaudience',
					issuer: 'myissuer',
					expiresIn: '1h',
				},
			};
			const error = new Error('Object has no algorithm.');

			return { input, error };
		};

		it('should throw', () => {
			const { input, error } = setup();

			expect(() => AuthConfigFactory.build(input)).toThrow(error);
		});
	});

	describe('when algorithm prop is number', () => {
		const setup = () => {
			const input = {
				secret: 'mysecret',
				jwtOptions: {
					header: { typ: 'JWT' },
					audience: 'myaudience',
					issuer: 'myissuer',
					algorithm: 123,
					expiresIn: '1h',
				},
			};
			const error = new Error('Value is not in strings');

			return { input, error };
		};

		it('should throw', () => {
			const { input, error } = setup();

			expect(() => AuthConfigFactory.build(input)).toThrow(error);
		});
	});

	describe('when algorithm prop is not a valid algorithm', () => {
		const setup = () => {
			const input = {
				secret: 'mysecret',
				jwtOptions: {
					header: { typ: 'JWT' },
					audience: 'myaudience',
					issuer: 'myissuer',
					algorithm: 'invalid',
					expiresIn: '1h',
				},
			};
			const error = new Error('Value is not in strings');

			return { input, error };
		};

		it('should throw', () => {
			const { input, error } = setup();

			expect(() => AuthConfigFactory.build(input)).toThrow(error);
		});
	});

	describe('when expiresIn prop is undefined', () => {
		const setup = () => {
			const input = {
				secret: 'mysecret',
				jwtOptions: {
					header: { typ: 'JWT' },
					audience: 'myaudience',
					issuer: 'myissuer',
					algorithm: 'HS256',
				},
			};
			const error = new Error('Object has no expiresIn.');

			return { input, error };
		};

		it('should throw', () => {
			const { input, error } = setup();

			expect(() => AuthConfigFactory.build(input)).toThrow(error);
		});
	});

	describe('when expiresIn prop is number', () => {
		const setup = () => {
			const input = {
				secret: 'mysecret',
				jwtOptions: {
					header: { typ: 'JWT' },
					audience: 'myaudience',
					issuer: 'myissuer',
					algorithm: 'HS256',
					expiresIn: 123,
				},
			};
			const error = buildNotAStringError();

			return { input, error };
		};

		it('should throw', () => {
			const { input, error } = setup();

			expect(() => AuthConfigFactory.build(input)).toThrow(error);
		});
	});
});

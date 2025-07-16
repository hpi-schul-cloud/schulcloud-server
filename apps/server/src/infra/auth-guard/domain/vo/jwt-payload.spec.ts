import { ObjectId } from 'bson';
import { jwtPayloadVoFactory } from '../../testing';
import { JwtPayload } from './jwt-payload.vo';

describe('JwtPayload', () => {
	describe('constructor', () => {
		afterEach(() => {
			jest.resetAllMocks();
		});

		describe('when valid props are provided', () => {
			it('should assign all properties correctly', () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const payload = new JwtPayload(customJwtPayloadProps);

				expect(payload.accountId).toBe(customJwtPayloadProps.accountId);
				expect(payload.userId).toBe(customJwtPayloadProps.userId);
				expect(payload.schoolId).toBe(customJwtPayloadProps.schoolId);
				expect(payload.roles).toEqual(customJwtPayloadProps.roles);
				expect(payload.support).toBe(customJwtPayloadProps.support);
				expect(payload.systemId).toBe(customJwtPayloadProps.systemId);
				expect(payload.supportUserId).toBe(customJwtPayloadProps.supportUserId);
				expect(payload.isExternalUser).toBe(customJwtPayloadProps.isExternalUser);
				expect(payload.aud).toBe(customJwtPayloadProps.aud);
				expect(payload.exp).toBe(customJwtPayloadProps.exp);
				expect(payload.iat).toBe(customJwtPayloadProps.iat);
				expect(payload.iss).toBe(customJwtPayloadProps.iss);
				expect(payload.jti).toBe(customJwtPayloadProps.jti);
				expect(payload.sub).toBe(customJwtPayloadProps.sub);
			});
		});

		describe('when accountId is missing', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, accountId: undefined };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when accountId is not a valid MongoId', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, accountId: 'not-a-mongoid' };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when userId is missing', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, userId: undefined };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when userId is not a valid MongoId', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, userId: 'not-a-mongoid' };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when schoolId is missing', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, schoolId: undefined };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when schoolId is not a valid MongoId', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, schoolId: 'not-a-mongoid' };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when roles is missing', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, roles: undefined };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when roles is not an array', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, roles: 'not-an-array' };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when roles is not an array of MongoIds', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, roles: ['not-a-mongoid'] };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when support is missing', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, support: undefined };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when support is not a boolean', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, support: 'not-boolean' };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when systemId is not a string', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, systemId: 123 };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when supportUserId is not a string', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, supportUserId: 123 };

				return { props };
			};
			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when isExternalUser is missing', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, isExternalUser: undefined };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when isExternalUser is not a boolean', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, isExternalUser: 'not-boolean' };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when aud is missing', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, aud: undefined };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when aud is not a string', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, aud: 123 };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when exp is missing', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, exp: undefined };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when exp is not a number', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, exp: 'not-a-number' };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when iat is missing', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, iat: undefined };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when iat is not a number', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, iat: 'not-a-number' };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when iss is missing', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, iss: undefined };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when iss is not a string', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, iss: 123 };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when jti is missing', () => {
			const setup = () => {
				const accountId = new ObjectId().toHexString();
				const props = { accountId };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when jti is not a string', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, jti: 123 };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});

		describe('when sub is not a string', () => {
			const setup = () => {
				const customJwtPayloadProps = jwtPayloadVoFactory.build();
				const props = { ...customJwtPayloadProps, sub: 123 };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new JwtPayload(props as unknown as JwtPayload)).toThrow();
			});
		});
	});
});

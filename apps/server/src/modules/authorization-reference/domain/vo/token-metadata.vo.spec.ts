import { AuthorizableReferenceType } from '@modules/authorization';
import { authorizationContextFactory } from '@modules/authorization/testing';
import { ObjectId } from 'bson';
import { TokenMetadata } from './token-metadata.vo';

describe('TokenMetadata', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('constructor', () => {
		describe('when called with valid properties', () => {
			const setup = () => {
				const authorizationContext = authorizationContextFactory.build();
				const referenceType = AuthorizableReferenceType.School;
				const referenceId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const accountId = new ObjectId().toHexString();
				const jwtJti = 'jti-12345';
				const customPayload = { foo: 'bar' };
				const tokenTtlInSeconds = 3600;

				const props = {
					authorizationContext,
					referenceType,
					referenceId,
					userId,
					customPayload,
					accountId,
					jwtJti,
					tokenTtlInSeconds,
				};

				return {
					props,
				};
			};

			it('should assign all properties correctly', () => {
				const { props } = setup();
				const { authorizationContext, referenceType, referenceId, userId, customPayload, accountId, jwtJti } = props;

				const tokenMetadata = new TokenMetadata(props);

				expect(tokenMetadata.authorizationContext).toBe(authorizationContext);
				expect(tokenMetadata.referenceType).toBe(referenceType);
				expect(tokenMetadata.referenceId).toBe(referenceId);
				expect(tokenMetadata.userId).toBe(userId);
				expect(tokenMetadata.accountId).toBe(accountId);
				expect(tokenMetadata.jwtJti).toBe(jwtJti);
				expect(tokenMetadata.customPayload).toBe(customPayload);
			});
		});

		describe('when called without customPayload', () => {
			const setup = () => {
				const authorizationContext = authorizationContextFactory.build();
				const referenceType = AuthorizableReferenceType.School;
				const referenceId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const accountId = new ObjectId().toHexString();
				const jwtJti = 'jti-12345';
				const tokenTtlInSeconds = 3600;

				const props = {
					authorizationContext,
					referenceType,
					referenceId,
					userId,
					accountId,
					jwtJti,
					tokenTtlInSeconds,
				};

				return {
					props,
				};
			};

			it('should default customPayload to an empty object', () => {
				const { props } = setup();

				const tokenMetadata = new TokenMetadata(props);

				expect(tokenMetadata.customPayload).toEqual({});
			});
		});

		describe('when called with invalid properties', () => {
			describe('when all properties are undefined', () => {
				const setup = () => {
					const props = {
						authorizationContext: undefined,
						referenceType: undefined,
						referenceId: undefined,
						accountId: undefined,
						jwtJti: undefined,
						userId: undefined,
						customPayload: undefined,
						tokenTtlInSeconds: undefined,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props as unknown as TokenMetadata)).toThrow();
				});
			});

			describe('when only customPayload is provided', () => {
				const setup = () => {
					const props = {
						customPayload: { foo: 'bar' },
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props as unknown as TokenMetadata)).toThrow();
				});
			});

			describe('when only referenceId is invalid', () => {
				const setup = () => {
					const authorizationContext = authorizationContextFactory.build();
					const referenceType = AuthorizableReferenceType.School;
					const referenceId = null;
					const userId = new ObjectId().toHexString();
					const accountId = new ObjectId().toHexString();
					const jwtJti = 'jti-12345';
					const tokenTtlInSeconds = 3600;

					const props = {
						authorizationContext,
						referenceType,
						referenceId,
						userId,
						accountId,
						jwtJti,
						tokenTtlInSeconds,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props as unknown as TokenMetadata)).toThrow();
				});
			});

			describe('when referenceType is not a valid enum value', () => {
				const setup = () => {
					const authorizationContext = authorizationContextFactory.build();
					const referenceType = 'INVALID_ENUM';
					const referenceId = new ObjectId().toHexString();
					const userId = new ObjectId().toHexString();
					const accountId = new ObjectId().toHexString();
					const jwtJti = 'jti-12345';
					const tokenTtlInSeconds = 3600;

					const props = {
						authorizationContext,
						referenceType,
						referenceId,
						userId,
						accountId,
						jwtJti,
						tokenTtlInSeconds,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props as unknown as TokenMetadata)).toThrow();
				});
			});

			describe('when referenceId is not a valid MongoId', () => {
				const setup = () => {
					const authorizationContext = authorizationContextFactory.build();
					const referenceType = AuthorizableReferenceType.School;
					const referenceId = 'not-a-mongoid';
					const userId = new ObjectId().toHexString();
					const accountId = new ObjectId().toHexString();
					const jwtJti = 'jti-12345';
					const tokenTtlInSeconds = 3600;

					const props = {
						authorizationContext,
						referenceType,
						referenceId,
						userId,
						accountId,
						jwtJti,
						tokenTtlInSeconds,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props as unknown as TokenMetadata)).toThrow();
				});
			});

			describe('when userId is not a valid MongoId', () => {
				const setup = () => {
					const authorizationContext = authorizationContextFactory.build();
					const referenceType = AuthorizableReferenceType.School;
					const referenceId = new ObjectId().toHexString();
					const userId = 'not-a-mongoid';
					const accountId = new ObjectId().toHexString();
					const jwtJti = 'jti-12345';
					const tokenTtlInSeconds = 3600;

					const props = {
						authorizationContext,
						referenceType,
						referenceId,
						userId,
						accountId,
						jwtJti,
						tokenTtlInSeconds,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props as unknown as TokenMetadata)).toThrow();
				});
			});

			describe('when customPayload is not an object', () => {
				const setup = () => {
					const authorizationContext = authorizationContextFactory.build();
					const referenceType = AuthorizableReferenceType.School;
					const referenceId = new ObjectId().toHexString();
					const userId = new ObjectId().toHexString();
					const customPayload = 42;
					const accountId = new ObjectId().toHexString();
					const jwtJti = 'jti-12345';
					const tokenTtlInSeconds = 3600;

					const props = {
						authorizationContext,
						referenceType,
						referenceId,
						userId,
						customPayload,
						accountId,
						jwtJti,
						tokenTtlInSeconds,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props as unknown as TokenMetadata)).toThrow();
				});
			});

			describe('when accountId is not a valid MongoId', () => {
				const setup = () => {
					const authorizationContext = authorizationContextFactory.build();
					const referenceType = AuthorizableReferenceType.School;
					const referenceId = new ObjectId().toHexString();
					const userId = new ObjectId().toHexString();
					const accountId = 'not-a-mongoid';
					const jwtJti = 'jti-12345';
					const tokenTtlInSeconds = 3600;

					const props = {
						authorizationContext,
						referenceType,
						referenceId,
						userId,
						accountId,
						jwtJti,
						tokenTtlInSeconds,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props as unknown as TokenMetadata)).toThrow();
				});
			});

			describe('when jwtJti is not a string', () => {
				const setup = () => {
					const authorizationContext = authorizationContextFactory.build();
					const referenceType = AuthorizableReferenceType.School;
					const referenceId = new ObjectId().toHexString();
					const userId = new ObjectId().toHexString();
					const accountId = new ObjectId().toHexString();
					const jwtJti = 12345;
					const tokenTtlInSeconds = 3600;

					const props = {
						authorizationContext,
						referenceType,
						referenceId,
						userId,
						accountId,
						jwtJti,
						tokenTtlInSeconds,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props as unknown as TokenMetadata)).toThrow();
				});
			});

			describe('when authorizationContext is not an instance of AuthorizationContext', () => {
				const setup = () => {
					const referenceType = AuthorizableReferenceType.School;
					const referenceId = new ObjectId().toHexString();
					const userId = new ObjectId().toHexString();
					const accountId = new ObjectId().toHexString();
					const jwtJti = 'jti-12345';
					const customPayload = { foo: 'bar' };
					const tokenTtlInSeconds = 3600;

					const props = {
						authorizationContext: {},
						referenceType,
						referenceId,
						userId,
						accountId,
						jwtJti,
						customPayload,
						tokenTtlInSeconds,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props as unknown as TokenMetadata)).toThrow();
				});
			});

			describe('when tokenTtlInSeconds is undefined', () => {
				const setup = () => {
					const authorizationContext = authorizationContextFactory.build();
					const referenceType = AuthorizableReferenceType.School;
					const referenceId = new ObjectId().toHexString();
					const userId = new ObjectId().toHexString();
					const accountId = new ObjectId().toHexString();
					const jwtJti = 'jti-12345';
					const customPayload = { foo: 'bar' };
					const tokenTtlInSeconds = undefined;

					const props = {
						authorizationContext,
						referenceType,
						referenceId,
						userId,
						accountId,
						jwtJti,
						customPayload,
						tokenTtlInSeconds,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props as unknown as TokenMetadata)).toThrow();
				});
			});

			describe('when tokenTtlInSeconds is not a number', () => {
				const setup = () => {
					const authorizationContext = authorizationContextFactory.build();
					const referenceType = AuthorizableReferenceType.School;
					const referenceId = new ObjectId().toHexString();
					const userId = new ObjectId().toHexString();
					const accountId = new ObjectId().toHexString();
					const jwtJti = 'jti-12345';
					const customPayload = { foo: 'bar' };
					const tokenTtlInSeconds = 'not-a-number';

					const props = {
						authorizationContext,
						referenceType,
						referenceId,
						userId,
						accountId,
						jwtJti,
						customPayload,
						tokenTtlInSeconds,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props as unknown as TokenMetadata)).toThrow();
				});
			});

			describe('when tokenTtlInSeconds is less than 0', () => {
				const setup = () => {
					const authorizationContext = authorizationContextFactory.build();
					const referenceType = AuthorizableReferenceType.School;
					const referenceId = new ObjectId().toHexString();
					const userId = new ObjectId().toHexString();
					const accountId = new ObjectId().toHexString();
					const jwtJti = 'jti-12345';
					const customPayload = { foo: 'bar' };
					const tokenTtlInSeconds = -1;

					const props = {
						authorizationContext,
						referenceType,
						referenceId,
						userId,
						accountId,
						jwtJti,
						customPayload,
						tokenTtlInSeconds,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props as unknown as TokenMetadata)).toThrow();
				});
			});

			describe('when tokenTtlInSeconds is greater than seven days', () => {
				const setup = () => {
					const authorizationContext = authorizationContextFactory.build();
					const referenceType = AuthorizableReferenceType.School;
					const referenceId = new ObjectId().toHexString();
					const userId = new ObjectId().toHexString();
					const accountId = new ObjectId().toHexString();
					const jwtJti = 'jti-12345';
					const customPayload = { foo: 'bar' };
					const tokenTtlInSeconds = 604801; // 7 days + 1 second

					const props = {
						authorizationContext,
						referenceType,
						referenceId,
						userId,
						accountId,
						jwtJti,
						customPayload,
						tokenTtlInSeconds,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props as unknown as TokenMetadata)).toThrow();
				});
			});
		});
	});
});

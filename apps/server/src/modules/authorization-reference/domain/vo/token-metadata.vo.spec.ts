import { AuthorizableReferenceType } from '@modules/authorization';
import { ObjectId } from 'bson';
import { authorizationContextFactory } from '../../testing';
import { TokenMetadata } from './token-metadata';

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
				const customPayload = { foo: 'bar' };

				const props = {
					authorizationContext,
					referenceType,
					referenceId,
					userId,
					customPayload,
				};

				return {
					props,
				};
			};

			it('should assign all properties correctly', () => {
				const { props } = setup();
				const { authorizationContext, referenceType, referenceId, userId, customPayload } = props;

				const tokenMetadata = new TokenMetadata(props);

				expect(tokenMetadata.authorizationContext).toBe(authorizationContext);
				expect(tokenMetadata.referenceType).toBe(referenceType);
				expect(tokenMetadata.referenceId).toBe(referenceId);
				expect(tokenMetadata.userId).toBe(userId);
				expect(tokenMetadata.customPayload).toBe(customPayload);
			});
		});

		describe('when called without customPayload', () => {
			const setup = () => {
				const authorizationContext = authorizationContextFactory.build();
				const referenceType = AuthorizableReferenceType.School;
				const referenceId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();

				const props = {
					authorizationContext,
					referenceType,
					referenceId,
					userId,
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
						userId: undefined,
						customPayload: undefined,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props)).toThrow();
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

					expect(() => new TokenMetadata(props)).toThrow();
				});
			});

			describe('when only referenceId is invalid', () => {
				const setup = () => {
					const authorizationContext = authorizationContextFactory.build();
					const referenceType = AuthorizableReferenceType.School;
					const referenceId = null;
					const userId = new ObjectId().toHexString();

					const props = {
						authorizationContext,
						referenceType,
						referenceId,
						userId,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props)).toThrow();
				});
			});

			describe('when referenceType is not a valid enum value', () => {
				const setup = () => {
					const authorizationContext = authorizationContextFactory.build();
					const referenceType = 'INVALID_ENUM';
					const referenceId = new ObjectId().toHexString();
					const userId = new ObjectId().toHexString();

					const props = {
						authorizationContext,
						referenceType,
						referenceId,
						userId,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props)).toThrow();
				});
			});

			describe('when referenceId is not a valid MongoId', () => {
				const setup = () => {
					const authorizationContext = authorizationContextFactory.build();
					const referenceType = AuthorizableReferenceType.School;
					const referenceId = 'not-a-mongoid';
					const userId = new ObjectId().toHexString();

					const props = {
						authorizationContext,
						referenceType,
						referenceId,
						userId,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props)).toThrow();
				});
			});

			describe('when userId is not a valid MongoId', () => {
				const setup = () => {
					const authorizationContext = authorizationContextFactory.build();
					const referenceType = AuthorizableReferenceType.School;
					const referenceId = new ObjectId().toHexString();
					const userId = 'not-a-mongoid';

					const props = {
						authorizationContext,
						referenceType,
						referenceId,
						userId,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props)).toThrow();
				});
			});

			describe('when customPayload is not an object', () => {
				const setup = () => {
					const authorizationContext = authorizationContextFactory.build();
					const referenceType = AuthorizableReferenceType.School;
					const referenceId = new ObjectId().toHexString();
					const userId = new ObjectId().toHexString();
					const customPayload = 42;

					const props = {
						authorizationContext,
						referenceType,
						referenceId,
						userId,
						customPayload,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => new TokenMetadata(props)).toThrow();
				});
			});
		});
	});
});

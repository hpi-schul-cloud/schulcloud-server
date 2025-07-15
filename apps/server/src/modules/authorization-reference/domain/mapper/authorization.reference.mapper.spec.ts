import { jwtPayloadFactory } from '@infra/auth-guard/testing';
import { ObjectId } from 'bson';
import { createAccessTokenParamsFactory } from '../../testing/create-access-token.params.factory';
import { AuthorizationContext, TokenMetadata } from '../vo';
import { TokenMetadataMapper } from './authorization.reference.mapper';

describe('TokenMetadataMapper', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	/* describe('mapToTokenMetadata', () => {
		describe('when called with valid props', () => {
			it('should map props to a valid TokenMetadata instance', () => {
				const tokenMetadataProps = tokenMetadataTestFactory.build();

				const result = TokenMetadataMapper.mapToTokenMetadata(tokenMetadataProps);

				expect(result).toBeInstanceOf(TokenMetadata);
				expect(result.authorizationContext).toEqual(expect.any(Object));
				expect(result.referenceType).toBe(tokenMetadataProps.referenceType);
				expect(result.referenceId).toBe(tokenMetadataProps.referenceId);
				expect(result.userId).toBe(tokenMetadataProps.userId);
				expect(result.customPayload).toBe(tokenMetadataProps.customPayload);
			});
		});

		describe('when called with invalid props', () => {
			describe('when required fields are missing', () => {
				const setup = () => {
					const props = {};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => TokenMetadataMapper.mapToTokenMetadata(props)).toThrow();
				});
			});

			describe('when props is not an object', () => {
				const setup = () => {
					const props = null;

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => TokenMetadataMapper.mapToTokenMetadata(props)).toThrow();
				});
			});

			describe('when authorizationContext is missing', () => {
				const setup = () => {
					const referenceType = AuthorizableReferenceType.School;
					const referenceId = new ObjectId().toHexString();
					const userId = new ObjectId().toHexString();

					const props = {
						referenceType,
						referenceId,
						userId,
					};

					return { props };
				};

				it('should throw an error', () => {
					const { props } = setup();

					expect(() => TokenMetadataMapper.mapToTokenMetadata(props)).toThrow();
				});
			});
		});
	}); */

	describe('mapFromParamsToTokenMetadata', () => {
		const setup = () => {
			const params = createAccessTokenParamsFactory.build();
			const userId = new ObjectId().toHexString();
			const jwtPayload = jwtPayloadFactory.build();
			console.log('params', params);
			return {
				params,
				userId,
				jwtPayload,
			};
		};

		it('should ', () => {
			const { params, userId, jwtPayload } = setup();
			console.log('params', params);

			const result = TokenMetadataMapper.mapFromParamsToTokenMetadata(params, userId, jwtPayload);

			expect(result).toBeInstanceOf(TokenMetadata);
			expect(result.userId).toBe(userId);
			expect(result.accountId).toBe(jwtPayload.accountId);
			expect(result.jwtJti).toBe(jwtPayload.jti);
			expect(result.authorizationContext).toBeInstanceOf(AuthorizationContext);
			expect(result.customPayload).toBe(params.payload);
			expect(result.referenceType).toBe(params.referenceType);
			expect(result.referenceId).toBe(params.referenceId);
		});
	});
});

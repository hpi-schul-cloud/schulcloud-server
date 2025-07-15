import { jwtPayloadFactory } from '@infra/auth-guard/testing';
import { createAccessTokenParamsTestFactory } from '@modules/authorization-reference/testing';
import { tokenMetadataTestFactory } from '../../testing/token-metadata.factory';
import { AuthorizationContext, TokenMetadata } from '../vo';
import { TokenMetadataFactory } from './token-metadata.factory';

describe('TokenMetadataFactory', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('build', () => {
		describe('when called with valid TokenMetadata', () => {
			describe('should return a TokenMetadata instance', () => {
				it('returns a TokenMetadata', () => {
					const tokenMetadataProps = tokenMetadataTestFactory.build();

					const result = TokenMetadataFactory.build(tokenMetadataProps);

					expect(result).toBeInstanceOf(TokenMetadata);
					expect(result.authorizationContext).toBeInstanceOf(AuthorizationContext);
				});
			});
		});
	});

	describe('buildFromCreateAccessTokenParams', () => {
		describe('when called with valid params, userId, and jwtPayload', () => {
			describe('should return a TokenMetadata instance', () => {
				const setup = () => {
					const tokenMeta = tokenMetadataTestFactory.build();
					const params = createAccessTokenParamsTestFactory().build();
					const { userId } = tokenMeta;
					const jwtPayload = jwtPayloadFactory.build();

					return {
						params,
						userId,
						jwtPayload,
					};
				};

				it('returns a TokenMetadata with expected values', () => {
					const { params, userId, jwtPayload } = setup();

					const result = TokenMetadataFactory.buildFromCreateAccessTokenParams(params, userId, jwtPayload);

					expect(result).toBeInstanceOf(TokenMetadata);
					expect(result.authorizationContext).toBeInstanceOf(AuthorizationContext);
				});
			});
		});
	});
});

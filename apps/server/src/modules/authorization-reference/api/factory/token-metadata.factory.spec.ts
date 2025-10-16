import { AuthorizationContext } from '@modules/authorization';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { createAccessTokenParamsTestFactory, tokenMetadataTestFactory } from '../../testing';
import { TokenMetadata } from '../vo';
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
		describe('when called with valid props', () => {
			describe('should return a TokenMetadata instance', () => {
				const setup = () => {
					const params = createAccessTokenParamsTestFactory().build();
					const currentUser = currentUserFactory.build();
					const jti = 'jti-12345';

					return {
						params,
						currentUser,
						jti,
					};
				};

				it('returns a TokenMetadata with expected values', () => {
					const { params, currentUser, jti } = setup();

					const result = TokenMetadataFactory.buildFromCreateAccessTokenParams(params, currentUser, jti);

					expect(result).toBeInstanceOf(TokenMetadata);
					expect(result.authorizationContext).toBeInstanceOf(AuthorizationContext);
				});
			});
		});
	});
});

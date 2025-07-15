import { AuthorizableReferenceType } from '@modules/authorization';
import { ObjectId } from 'bson';
import { tokenMetadataTestFactory } from '../../testing';
import { TokenMetadataMapper } from '../mapper/authorization.reference.mapper';
import { TokenMetadata } from '../vo';

describe('TokenMetadataMapper', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('mapToTokenMetadata', () => {
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
	});
});

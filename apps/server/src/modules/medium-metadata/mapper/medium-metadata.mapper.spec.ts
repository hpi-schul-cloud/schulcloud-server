import { vidisOfferItemFactory } from '@infra/vidis-client/testing';
import { MediumMetadataDto } from '../dto';
import { MediumMetadataMapper } from './medium-metadata.mapper';

describe(MediumMetadataMapper.name, () => {
	describe('mapVidisMetadataToMediumMetadata', () => {
		describe('when the metadata has a offerTitle', () => {
			it('should return the correct MediumMetadataDto', () => {
				const mediumId = 'test-medium-id';
				const title = 'test-title';
				const metadata = vidisOfferItemFactory.build({ offerTitle: title });

				const result = MediumMetadataMapper.mapVidisMetadataToMediumMetadata(mediumId, metadata);

				expect(result).toEqual<MediumMetadataDto>({
					mediumId,
					name: title,
					description: metadata.offerDescription,
					logoUrl: metadata.offerLogo,
				});
			});
		});

		describe('when the metadata has no offerTitle but a offerLongTitle', () => {
			it('should return the correct MediumMetadataDto', () => {
				const mediumId = 'test-medium-id';
				const longTitle = 'test-long-title';
				const metadata = vidisOfferItemFactory.build({ offerTitle: undefined, offerLongTitle: longTitle });

				const result = MediumMetadataMapper.mapVidisMetadataToMediumMetadata(mediumId, metadata);

				expect(result).toEqual<MediumMetadataDto>({
					mediumId,
					name: longTitle,
					description: metadata.offerDescription,
					logoUrl: metadata.offerLogo,
				});
			});
		});

		describe('when the metadata has no offerTitle and offerLongTitle', () => {
			it('should return the correct MediumMetadataDto', () => {
				const mediumId = 'test-medium-id';
				const metadata = vidisOfferItemFactory.build({ offerTitle: undefined, offerLongTitle: undefined });

				const result = MediumMetadataMapper.mapVidisMetadataToMediumMetadata(mediumId, metadata);

				expect(result).toEqual<MediumMetadataDto>({
					mediumId,
					name: '',
					description: metadata.offerDescription,
					logoUrl: metadata.offerLogo,
				});
			});
		});
	});
});

import { vidisOfferItemFactory } from '@infra/vidis-client/testing';
import { base64TestLogo } from '@modules/tool/external-tool/testing';
import { MediumMetadataDto } from '../dto';
import { MediumMetadataMapper } from './medium-metadata.mapper';

describe(MediumMetadataMapper.name, () => {
	describe('mapVidisMetadataToMediumMetadata', () => {
		describe('when the metadata has an offerTitle', () => {
			it('should return the correct MediumMetadataDto', () => {
				const mediumId = 'test-medium-id';
				const title = 'test-title';
				const metadata = vidisOfferItemFactory.build({ offerTitle: title, offerLogo: undefined });

				const result = MediumMetadataMapper.mapVidisMetadataToMediumMetadata(mediumId, metadata);

				expect(result).toEqual<MediumMetadataDto>({
					mediumId,
					name: title,
					description: metadata.offerDescription,
				});
			});
		});

		describe('when the metadata has no offerTitle but a offerLongTitle', () => {
			it('should return the correct MediumMetadataDto', () => {
				const mediumId = 'test-medium-id';
				const longTitle = 'test-long-title';
				const metadata = vidisOfferItemFactory.build({
					offerTitle: undefined,
					offerLongTitle: longTitle,
					offerLogo: undefined,
				});

				const result = MediumMetadataMapper.mapVidisMetadataToMediumMetadata(mediumId, metadata);

				expect(result).toEqual<MediumMetadataDto>({
					mediumId,
					name: longTitle,
					description: metadata.offerDescription,
				});
			});
		});

		describe('when the metadata has no offerTitle and offerLongTitle', () => {
			it('should return the correct MediumMetadataDto', () => {
				const mediumId = 'test-medium-id';
				const metadata = vidisOfferItemFactory.build({
					offerTitle: undefined,
					offerLongTitle: undefined,
					offerLogo: undefined,
				});

				const result = MediumMetadataMapper.mapVidisMetadataToMediumMetadata(mediumId, metadata);

				expect(result).toEqual<MediumMetadataDto>({
					mediumId,
					name: '',
					description: metadata.offerDescription,
				});
			});
		});

		describe('when the metadata has an offerLogo', () => {
			it('should return the data-url for the logo', () => {
				const mediumId = 'test-medium-id';
				const title = 'test-title';
				const metadata = vidisOfferItemFactory.build({ offerTitle: title, offerLogo: base64TestLogo });

				const result = MediumMetadataMapper.mapVidisMetadataToMediumMetadata(mediumId, metadata);

				expect(result).toEqual<MediumMetadataDto>({
					mediumId,
					name: title,
					description: metadata.offerDescription,
					logoUrl: `data:image/png;base64,${base64TestLogo}`,
				});
			});
		});

		describe('when the metadata has an offerLogo', () => {
			it('should return undefined for the logo', () => {
				const mediumId = 'test-medium-id';
				const title = 'test-title';
				const metadata = vidisOfferItemFactory.build({ offerTitle: title, offerLogo: 'invalid' });

				const result = MediumMetadataMapper.mapVidisMetadataToMediumMetadata(mediumId, metadata);

				expect(result).toEqual<MediumMetadataDto>({
					mediumId,
					name: title,
					description: metadata.offerDescription,
					logoUrl: undefined,
				});
			});
		});
	});
});

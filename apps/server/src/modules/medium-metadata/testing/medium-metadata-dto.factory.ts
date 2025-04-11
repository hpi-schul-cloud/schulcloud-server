import { Factory } from 'fishery';
import { MediumMetadataDto } from '../dto';

export const mediumMetadataDtoFactory = Factory.define<MediumMetadataDto, MediumMetadataDto>(
	({ sequence }) =>
		new MediumMetadataDto({
			mediumId: `medium-id-${sequence}`,
			name: `Medium ${sequence}`,
			description: `Medium description ${sequence}`,
			publisher: `Medium publisher ${sequence}`,
			logoUrl: `https://logo.com/${sequence}`,
			logo: btoa(`logo-image-${sequence}`),
			previewLogoUrl: `https://preview.logo.com/${sequence}`,
			modifiedAt: new Date(),
		})
);

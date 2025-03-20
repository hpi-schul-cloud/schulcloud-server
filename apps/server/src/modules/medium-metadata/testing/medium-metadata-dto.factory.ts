import { Factory } from 'fishery';
import { MediumMetadataDto } from '../dto';

export const mediumMetadataDtoFactory = Factory.define<MediumMetadataDto, MediumMetadataDto>(
	({ sequence }) =>
		new MediumMetadataDto({
			name: `Medium ${sequence}`,
			description: `Medium description ${sequence}`,
			publisher: `Medium publisher ${sequence}`,
			logoUrl: `https://logo.com/${sequence}`,
			previewLogoUrl: `https://preview.logo.com/${sequence}`,
			modifiedAt: new Date(),
		})
);

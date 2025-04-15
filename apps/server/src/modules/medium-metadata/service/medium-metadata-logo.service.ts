import { Injectable } from '@nestjs/common';
import { ImageMimeType } from '@shared/domain/types';

const base64ImageTypeSignatures: Record<string, ImageMimeType> = {
	'/9j/': ImageMimeType.JPEG,
	iVBORw0KGgo: ImageMimeType.PNG,
	R0lGODdh: ImageMimeType.GIF,
	R0lGODlh: ImageMimeType.GIF,
};

@Injectable()
export class MediumMetadataLogoService {
	public detectAndValidateLogoImageType(base64Image: string): ImageMimeType | undefined {
		const detectedSignature: string | undefined = Object.keys(base64ImageTypeSignatures).find((signature: string) =>
			base64Image.startsWith(signature)
		);

		if (!detectedSignature) {
			return undefined;
		}

		const contentType: ImageMimeType = base64ImageTypeSignatures[detectedSignature];

		return contentType;
	}
}

export class MediaMetadataDto {
	name: string;

	description?: string;

	publisher?: string;

	logoUrl?: string;

	previewLogoUrl?: string;

	modifiedAt?: Date;

	constructor(response: MediaMetadataDto) {
		this.name = response.name;
		this.description = response.description;
		this.publisher = response.publisher;
		this.logoUrl = response.logoUrl;
		this.previewLogoUrl = response.previewLogoUrl;
		this.modifiedAt = response.modifiedAt;
	}
}

export class MediaMetadataDto {
	public name: string;

	public description?: string;

	public publisher?: string;

	public logoUrl?: string;

	public previewLogoUrl?: string;

	public modifiedAt?: Date;

	constructor(response: MediaMetadataDto) {
		this.name = response.name;
		this.description = response.description;
		this.publisher = response.publisher;
		this.logoUrl = response.logoUrl;
		this.previewLogoUrl = response.previewLogoUrl;
		this.modifiedAt = response.modifiedAt;
	}
}

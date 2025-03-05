export class ExternalToolMediumMetadata {
	name: string;

	description?: string;

	publisher?: string;

	logoUrl?: string;

	previewLogoUrl?: string;

	modified?: string;

	constructor(response: ExternalToolMediumMetadata) {
		this.name = response.name;
		this.description = response.description;
		this.publisher = response.publisher;
		this.logoUrl = response.logoUrl;
		this.previewLogoUrl = response.previewLogoUrl;
		this.modified = response.modified;
	}
}

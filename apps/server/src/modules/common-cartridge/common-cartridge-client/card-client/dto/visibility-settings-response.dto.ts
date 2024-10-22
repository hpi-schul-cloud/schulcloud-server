export class VisibilitySettingsResponseDto {
	publishedAt: string | undefined;

	constructor(publishedAt: string) {
		this.publishedAt = publishedAt;
	}
}

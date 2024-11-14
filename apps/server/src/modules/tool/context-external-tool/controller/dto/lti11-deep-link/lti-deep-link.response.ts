import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LtiDeepLinkResponse {
	@ApiProperty()
	mediaType: string;

	@ApiPropertyOptional()
	url?: string;

	@ApiPropertyOptional()
	title?: string;

	constructor(props: LtiDeepLinkResponse) {
		this.mediaType = props.mediaType;
		this.title = props.title;
	}
}

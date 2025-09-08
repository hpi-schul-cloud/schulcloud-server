import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LtiDeepLinkResponse {
	@ApiProperty()
	mediaType: string;

	@ApiPropertyOptional()
	title?: string;

	@ApiPropertyOptional()
	text?: string;

	@ApiPropertyOptional()
	availableFrom?: Date;

	@ApiPropertyOptional()
	availableUntil?: Date;

	@ApiPropertyOptional()
	submissionFrom?: Date;

	@ApiPropertyOptional()
	submissionUntil?: Date;

	constructor(props: LtiDeepLinkResponse) {
		this.mediaType = props.mediaType;
		this.title = props.title;
		this.text = props.text;
		this.availableFrom = props.availableFrom;
		this.availableUntil = props.availableUntil;
		this.submissionFrom = props.submissionFrom;
		this.submissionUntil = props.submissionUntil;
	}
}

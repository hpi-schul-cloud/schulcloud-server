import { ApiPropertyOptional } from '@nestjs/swagger';

export class LtiDeepLinkResponse {
	@ApiPropertyOptional()
	title?: string;

	constructor(props: LtiDeepLinkResponse) {
		this.title = props.title;
	}
}

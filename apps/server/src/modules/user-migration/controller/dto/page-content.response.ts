import { ApiPropertyOptional } from '@nestjs/swagger';

export class PageContentResponse {
	@ApiPropertyOptional({
		description: 'The URL for the proceed button',
	})
	proceedButtonUrl?: string;

	@ApiPropertyOptional({
		description: 'The URL for the proceed button',
	})
	cancelButtonUrl?: string;

	constructor(props: PageContentResponse) {
		this.proceedButtonUrl = props.proceedButtonUrl;
		this.cancelButtonUrl = props.cancelButtonUrl;
	}
}

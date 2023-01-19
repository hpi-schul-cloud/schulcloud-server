import { ApiProperty } from '@nestjs/swagger';

export class PageContentResponse {
	@ApiProperty({
		description: 'The URL for the proceed button',
	})
	proceedButtonUrl: string;

	@ApiProperty({
		description: 'The URL for the cancel button',
	})
	cancelButtonUrl: string;

	constructor(props: PageContentResponse) {
		this.proceedButtonUrl = props.proceedButtonUrl;
		this.cancelButtonUrl = props.cancelButtonUrl;
	}
}

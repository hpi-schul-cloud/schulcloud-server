export class PageContentDto {
	proceedButtonUrl: string;

	cancelButtonUrl: string;

	constructor(props: PageContentDto) {
		this.proceedButtonUrl = props.proceedButtonUrl;
		this.cancelButtonUrl = props.cancelButtonUrl;
	}
}

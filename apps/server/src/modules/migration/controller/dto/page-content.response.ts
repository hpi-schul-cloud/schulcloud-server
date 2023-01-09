export class PageContentResponse {
	proceedButtonUrl?: string;

	cancelButtonUrl?: string;

	constructor(props: PageContentResponse) {
		this.proceedButtonUrl = props.proceedButtonUrl;
		this.cancelButtonUrl = props.cancelButtonUrl;
	}
}

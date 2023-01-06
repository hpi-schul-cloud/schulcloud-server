export class PageContentResponse {
	contentKey: string;

	proceedButtonKey: string;

	proceedButtonUrl: string;

	cancelButtonKey: string;

	cancelButtonUrl: string;

	constructor(props: PageContentResponse) {
		this.contentKey = props.contentKey;
		this.proceedButtonKey = props.proceedButtonKey;
		this.proceedButtonUrl = props.proceedButtonUrl;
		this.cancelButtonKey = props.cancelButtonKey;
		this.cancelButtonUrl = props.cancelButtonUrl;
	}
}

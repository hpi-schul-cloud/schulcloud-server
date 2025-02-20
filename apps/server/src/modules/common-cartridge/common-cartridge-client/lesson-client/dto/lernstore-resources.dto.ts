import { LernstoreResources } from '../lessons-api-client';

export class LernstoreResourcesDto {
	public client: string;

	public description: string;

	public merlinReference?: string;

	public title: string;

	public url?: string;

	constructor(props: LernstoreResources) {
		this.client = props.client;
		this.description = props.description;
		this.merlinReference = props.merlinReference;
		this.title = props.title;
		this.url = props.url;
	}
}

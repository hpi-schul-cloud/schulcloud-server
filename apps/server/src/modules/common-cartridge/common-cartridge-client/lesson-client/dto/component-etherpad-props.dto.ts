import { ComponentEtherpadPropsImpl } from '../lessons-api-client';

export class ComponentEtherpadPropsDto {
	description!: string;

	title!: string;

	url!: string;

	constructor(etherpadContent: ComponentEtherpadPropsImpl) {
		this.description = etherpadContent.description;
		this.title = etherpadContent.title;
		this.url = etherpadContent.url;
	}
}

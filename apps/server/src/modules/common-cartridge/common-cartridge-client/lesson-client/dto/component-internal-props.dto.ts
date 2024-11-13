import { ComponentInternalPropsImpl } from '../lessons-api-client';

export class ComponentInternalPropsDto {
	url!: string;

	constructor(internalContent: ComponentInternalPropsImpl) {
		this.url = internalContent.url;
	}
}

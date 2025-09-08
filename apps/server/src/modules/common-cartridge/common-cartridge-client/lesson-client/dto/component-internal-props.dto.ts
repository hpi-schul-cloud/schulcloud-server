import { ComponentInternalPropsImpl } from '../lessons-api-client';

export class ComponentInternalPropsDto {
	public url: string;

	constructor(internalContent: ComponentInternalPropsImpl) {
		this.url = internalContent.url;
	}
}

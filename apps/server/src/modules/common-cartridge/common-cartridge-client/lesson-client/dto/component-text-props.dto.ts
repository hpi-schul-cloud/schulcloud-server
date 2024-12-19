import { ComponentTextPropsImpl } from '../lessons-api-client';

export class ComponentTextPropsDto {
	public text: string;

	constructor(textContent: ComponentTextPropsImpl) {
		this.text = textContent.text;
	}
}

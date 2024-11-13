import { ComponentTextPropsImpl } from '../lessons-api-client';

export class ComponentTextPropsDto {
	text!: string;

	constructor(textContent: ComponentTextPropsImpl) {
		this.text = textContent.text;
	}
}

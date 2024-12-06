import { ComponentNexboardPropsImpl } from '../lessons-api-client';

export class ComponentNexboardPropsDto {
	board: string;

	description: string;

	title: string;

	url: string;

	constructor(nexboardContent: ComponentNexboardPropsImpl) {
		this.board = nexboardContent.board;
		this.description = nexboardContent.description;
		this.title = nexboardContent.title;
		this.url = nexboardContent.url;
	}
}

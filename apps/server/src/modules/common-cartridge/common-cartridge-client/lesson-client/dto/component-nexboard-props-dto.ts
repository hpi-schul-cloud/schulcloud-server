import { ComponentNexboardPropsImpl } from '../lessons-api-client';

export class ComponentNexboardPropsDto {
	public board: string;

	public description: string;

	public title: string;

	public url: string;

	constructor(nexboardContent: ComponentNexboardPropsImpl) {
		this.board = nexboardContent.board;
		this.description = nexboardContent.description;
		this.title = nexboardContent.title;
		this.url = nexboardContent.url;
	}
}

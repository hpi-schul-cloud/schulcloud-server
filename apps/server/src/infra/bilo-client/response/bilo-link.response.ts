import { IsString } from 'class-validator';

export class BiloLinkResponse {
	href!: string;

	@IsString()
	rel!: string;
}

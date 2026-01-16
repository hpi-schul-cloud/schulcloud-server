import { IsString } from 'class-validator';

export class BiloLinkResponse {
	public href!: string;

	@IsString()
	public rel!: string;
}

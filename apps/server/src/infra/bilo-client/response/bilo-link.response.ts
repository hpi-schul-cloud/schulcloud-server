import { IsString, IsUrl } from 'class-validator';

export class BiloLinkResponse {
	@IsUrl()
	public href!: string;

	@IsString()
	public rel!: string;
}

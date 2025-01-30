import { IsString } from 'class-validator';

export class BiloMediaQueryParams {
	@IsString()
	public id!: string;

	constructor(props: BiloMediaQueryParams) {
		this.id = props.id;
	}
}

import { IsString } from 'class-validator';

export class BiloMediaQueryBodyParams {
	@IsString()
	public id!: string;

	constructor(props: BiloMediaQueryBodyParams) {
		this.id = props.id;
	}
}

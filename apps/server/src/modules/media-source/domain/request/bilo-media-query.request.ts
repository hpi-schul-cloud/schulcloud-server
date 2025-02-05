import { IsString } from 'class-validator';

export class BiloMediaQueryRequest {
	@IsString()
	public id!: string;

	constructor(props: BiloMediaQueryRequest) {
		this.id = props.id;
	}
}

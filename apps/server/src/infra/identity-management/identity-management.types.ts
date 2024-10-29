import { ApiProperty } from '@nestjs/swagger';

export class IdentityProviderDto {
	@ApiProperty({ type: String, nullable: false })
	public alias: string;

	@ApiProperty({ type: String, nullable: true })
	public displayName: string | null;

	@ApiProperty({ type: String, nullable: false })
	public href: string;

	constructor(props: Readonly<IdentityProviderDto>) {
		this.alias = props.alias;
		this.displayName = props.displayName;
		this.href = props.href;
	}
}

import { RoleName } from '@shared/domain/interface';

export class ExternalClassDto {
	public readonly externalId: string;

	public readonly name: string;

	public readonly roles: RoleName[];

	constructor(props: Readonly<ExternalClassDto>) {
		this.externalId = props.externalId;
		this.name = props.name;
		this.roles = props.roles;
	}
}

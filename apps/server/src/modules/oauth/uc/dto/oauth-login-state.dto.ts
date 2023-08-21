import { EntityId } from '@shared/domain';

export class OauthLoginStateDto {
	state: string;

	systemId: EntityId;

	provider: string;

	postLoginRedirect?: string;

	userLoginMigrationId?: string;

	constructor(props: OauthLoginStateDto) {
		this.state = props.state;
		this.systemId = props.systemId;
		this.postLoginRedirect = props.postLoginRedirect;
		this.provider = props.provider;
		this.userLoginMigrationId = props.userLoginMigrationId;
	}
}

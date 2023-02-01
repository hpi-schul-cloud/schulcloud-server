import { EntityId } from '@shared/domain';

export class OauthLoginStateDto {
	state: string;

	systemId: EntityId;

	postLoginRedirect?: string;

	errorRedirect?: string;

	constructor(props: OauthLoginStateDto) {
		this.state = props.state;
		this.systemId = props.systemId;
		this.postLoginRedirect = props.postLoginRedirect;
		this.errorRedirect = props.errorRedirect;
	}
}

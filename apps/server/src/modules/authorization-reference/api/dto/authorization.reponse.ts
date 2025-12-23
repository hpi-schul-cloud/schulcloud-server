import { CustomPayload } from '@infra/access-token';
import { AuthorizableReferenceType } from '@modules/authorization/domain';
import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';

export class AuthorizedResponse {
	@ApiProperty()
	public userId: string;

	@ApiProperty()
	public isAuthorized: boolean;

	constructor(props: AuthorizedResponse) {
		this.userId = props.userId;
		this.isAuthorized = props.isAuthorized;
	}
}

export class AuthorizedByReferenceResponse {
	@ApiProperty()
	public userId: EntityId;

	@ApiProperty()
	public isAuthorized: boolean;

	@ApiProperty()
	public referenceType: AuthorizableReferenceType;

	@ApiProperty()
	public referenceId: EntityId;

	constructor(props: AuthorizedByReferenceResponse) {
		this.userId = props.userId;
		this.isAuthorized = props.isAuthorized;
		this.referenceType = props.referenceType;
		this.referenceId = props.referenceId;
	}
}

export class AccessTokenResponse {
	@ApiProperty()
	public token!: string;

	constructor(token: string) {
		this.token = token;
	}
}

export class AccessTokenPayloadResponse {
	@ApiProperty()
	public payload: CustomPayload;

	public ttl: number;

	constructor(props: CustomPayload, ttl: number) {
		this.payload = props;
		this.ttl = ttl;
	}
}

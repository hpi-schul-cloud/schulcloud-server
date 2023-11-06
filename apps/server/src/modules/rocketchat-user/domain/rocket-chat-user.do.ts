import { EntityId } from '@shared/domain/types';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export interface RocketChatUserProps extends AuthorizableObject {
	userId: EntityId;
	username: string;
	rcId: string;
	authToken?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export class RocketChatUser extends DomainObject<RocketChatUserProps> {
	get userId(): EntityId {
		return this.props.userId;
	}

	get username(): string {
		return this.props.username;
	}

	get rcId(): string {
		return this.props.rcId;
	}

	get authToken(): string | undefined {
		return this.props.authToken;
	}

	get createdAt(): Date | undefined {
		return this.props.createdAt;
	}

	get updatedAt(): Date | undefined {
		return this.props.updatedAt;
	}
}

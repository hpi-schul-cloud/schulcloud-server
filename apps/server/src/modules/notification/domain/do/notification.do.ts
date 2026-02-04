import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface NotificationProps extends AuthorizableObject {
	type: string;
	key: string;
	arguments: string[];
	userId: EntityId;
	createdAt?: Date;
	updatedAt?: Date;
}

export class Notification extends DomainObject<NotificationProps> {
	get type(): string {
		return this.props.type;
	}

	get key(): string {
		return this.props.key;
	}

	get arguments(): string[] {
		return this.props.arguments;
	}

	get userId(): EntityId {
		return this.props.userId;
	}

	get createdAt(): Date | undefined {
		return this.props.createdAt;
	}

	get updatedAt(): Date | undefined {
		return this.props.updatedAt;
	}
}

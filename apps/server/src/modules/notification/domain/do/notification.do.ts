import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { NotificationType } from '../../types';

export interface NotificationProps extends AuthorizableObject {
	type: NotificationType;
	key: string;
	arguments?: Record<string, unknown>;
	userId: EntityId;
	expiresAt: Date;
}

export class Notification extends DomainObject<NotificationProps> {
	get type(): NotificationType {
		return this.props.type;
	}

	get key(): string {
		return this.props.key;
	}

	get arguments(): Record<string, unknown> | undefined {
		return this.props.arguments;
	}

	get userId(): EntityId {
		return this.props.userId;
	}

	get expiresAt(): Date {
		return this.props.expiresAt;
	}
}

import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export interface NotificationProps extends AuthorizableObject {
	type: string;
    key: string;
    arguments: string[];
    userId: string;
}

export class NotificationDo extends DomainObject<NotificationProps> {
	public get type(): string {
		return this.props.type;
	}

    public get key(): string {
		return this.props.key;
	}

    public get arguments(): string[] {
		return this.props.arguments;
	}

    public get userId(): string {
		return this.props.userId;
	}
}
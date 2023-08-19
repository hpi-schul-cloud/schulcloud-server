import { EntityId } from '@shared/domain/types';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { TeamUser } from './team-user.do';

export interface TeamProps extends AuthorizableObject {
	id: EntityId;
	name: string;
	userIds: TeamUser[];
	createdAt: Date;
	updatedAt: Date;
}

export class Team extends DomainObject<TeamProps> {
	get id(): EntityId {
		return this.props.id;
	}

	get name(): string {
		return this.props.name;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	get userIds(): TeamUser[] {
		return this.props.userIds;
	}
}

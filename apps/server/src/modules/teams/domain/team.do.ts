import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { TeamUser } from './team-user.do';

export interface TeamProps extends AuthorizableObject {
	name: string;
	userIds: TeamUser[];
	createdAt: Date;
	updatedAt: Date;
}
export class Team extends DomainObject<TeamProps> {
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

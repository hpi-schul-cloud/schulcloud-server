import { Role, School, User } from '@shared/domain';

export interface TeamUserProps {
	user: User;
	role: Role;
	school: School;
}

export class TeamUser {
	protected props: TeamUserProps;

	constructor(props: TeamUserProps) {
		this.props = props;
	}

	get user(): User {
		return this.props.user;
	}

	get role(): Role {
		return this.props.role;
	}

	get school(): School {
		return this.props.school;
	}
}

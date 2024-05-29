import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export interface ClassProps extends AuthorizableObject {
	name: string;
	userIds: string[];
}

export class Class extends DomainObject<ClassProps> {
	public isClassOfUser(userId: string): boolean {
		const result = this.props.userIds.includes(userId);

		return result;
	}
}

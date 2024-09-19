import { EntityId } from '@shared/domain/types';
import { TypeGuard } from '@shared/common';
import { ICurrentUser } from '../interface';

interface RequiredCurrentUserProps {
	userId: EntityId;
	schoolId: EntityId;
	accountId: EntityId;
	roles: EntityId[];
}

export function isCurrentUser(input: unknown): input is ICurrentUser {
	const requiredInterfaceKeysMatch =
		TypeGuard.isEachKeyInObject(input, ['userId', 'roles', 'accountId', 'schoolId']) &&
		TypeGuard.isString(input.userId) &&
		TypeGuard.isString(input.schoolId) &&
		TypeGuard.isString(input.accountId) &&
		TypeGuard.isArray(input.roles) &&
		input.roles.every((id: unknown) => TypeGuard.isString(id));

	return requiredInterfaceKeysMatch;
}

export class CurrentUserBuilder {
	private props!: ICurrentUser;

	constructor(requiredProps: RequiredCurrentUserProps) {
		this.props = {
			userId: requiredProps.userId,
			schoolId: requiredProps.schoolId,
			accountId: requiredProps.accountId,
			roles: requiredProps.roles,
			impersonated: false,
			isExternalUser: false,
			systemId: undefined,
			externalIdToken: undefined,
		};
	}

	// creating a do representation of currentUser as class make sense
	// Please add validations to this type into this method
	public build(): ICurrentUser {
		return this.props;
	}

	public asUserSupporter(asUserSupporter?: boolean) {
		if (asUserSupporter === true) {
			this.props.impersonated = asUserSupporter;
		}

		return this;
	}

	// I expect that external user should always bound to external system, but the existing code give no feedback about it
	// Add isExternalUser modification to withExternalSystem if you can validate it.
	public asExternalUser(isExternalUser?: boolean) {
		if (isExternalUser === true) {
			this.props.isExternalUser = isExternalUser;
		}

		return this;
	}

	public withExternalSystem(systemId?: EntityId) {
		this.props.systemId = systemId;

		return this;
	}

	public asExternalUserWithToken(externalIdToken: string) {
		this.props.externalIdToken = externalIdToken;
		this.props.isExternalUser = true;

		return this;
	}
}

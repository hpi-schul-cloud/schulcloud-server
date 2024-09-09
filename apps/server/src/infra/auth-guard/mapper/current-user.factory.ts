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

	build(): ICurrentUser {
		return this.props;
	}

	asSupporter(asSupporter = true) {
		this.props.impersonated = asSupporter;

		return this;
	}

	// I expect that external user should always bound to external system, but the existing code give no feedback about it
	asExternalUser(isExternalUser = true) {
		this.props.isExternalUser = isExternalUser;

		return this;
	}

	withExternalSystem(systemId?: EntityId) {
		this.props.systemId = systemId;

		return this;
	}

	asExternalUserWithToken(externalIdToken: string) {
		this.props.externalIdToken = externalIdToken;
		this.props.isExternalUser = true;

		return this;
	}
}

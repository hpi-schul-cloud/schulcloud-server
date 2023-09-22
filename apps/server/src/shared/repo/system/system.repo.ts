import { Injectable } from '@nestjs/common';
import { SystemEntity, SystemTypeEnum } from '@shared/domain';
import { BaseRepo } from '@shared/repo/base.repo';
import { SystemScope } from '@shared/repo/system/system-scope';

@Injectable()
export class SystemRepo extends BaseRepo<SystemEntity> {
	get entityName() {
		return SystemEntity;
	}

	async findByFilter(type: SystemTypeEnum): Promise<SystemEntity[]> {
		const scope = new SystemScope();
		switch (type) {
			case SystemTypeEnum.LDAP:
				scope.withLdapConfig();
				break;
			case SystemTypeEnum.OAUTH:
				scope.withOauthConfig();
				break;
			case SystemTypeEnum.OIDC:
				scope.withOidcConfig();
				break;
			default:
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				throw new Error(`system type ${type} unknown`);
		}
		return this._em.find(SystemEntity, scope.query);
	}

	async findAll(): Promise<SystemEntity[]> {
		return this._em.find(SystemEntity, {});
	}
}

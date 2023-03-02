import { Injectable } from '@nestjs/common';
import { System, SystemTypeEnum } from '@shared/domain';
import { BaseRepo } from '@shared/repo/base.repo';
import { SystemScope } from '@shared/repo/system/system-scope';

@Injectable()
export class SystemRepo extends BaseRepo<System> {
	get entityName() {
		return System;
	}

	async findByFilter(type: SystemTypeEnum): Promise<System[]> {
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
				throw new Error('system type unknown');
		}
		return this._em.find(System, scope.query);
	}

	async findAll(): Promise<System[]> {
		return this._em.find(System, {});
	}
}

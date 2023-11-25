import { Injectable } from '@nestjs/common';
import { SystemEntity } from '@shared/domain/entity';
import { SystemTypeEnum } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { SystemScope } from '@shared/repo/system/system-scope';

// TODO N21-1547: Fully replace this service with SystemService
/**
 * @deprecated use the {@link SystemRepo} from the system module instead
 */
@Injectable()
export class LegacySystemRepo extends BaseRepo<SystemEntity> {
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

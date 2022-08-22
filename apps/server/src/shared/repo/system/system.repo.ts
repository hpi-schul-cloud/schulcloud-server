import { Injectable } from '@nestjs/common';
import { System } from '@shared/domain';
import { BaseRepo } from '@shared/repo/base.repo';
import { SystemScope } from '@shared/repo/system/system-scope';
import { SysType } from '../../infra/identity-management/sys.type';

@Injectable()
export class SystemRepo extends BaseRepo<System> {
	get entityName() {
		return System;
	}

	async findByFilter(type: string | SysType = '', onlyOauth = false): Promise<System[]> {
		const scope = new SystemScope();
		if (type) {
			scope.byType(type);
		}
		if (onlyOauth) {
			scope.withOauthConfigOnly();
		}
		return this._em.find(System, scope.query);
	}

	async findAll(): Promise<System[]> {
		return this._em.find(System, {});
	}
}

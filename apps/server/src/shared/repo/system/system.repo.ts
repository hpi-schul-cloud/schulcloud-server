import { Injectable } from '@nestjs/common';
import { System, SystemType } from '@shared/domain';
import { BaseRepo } from '@shared/repo/base.repo';
import { SystemScope } from '@shared/repo/system/system-scope';

@Injectable()
export class SystemRepo extends BaseRepo<System> {
	get entityName() {
		return System;
	}

	async findByFilter(type: string | SystemType = '', onlyOauth = false): Promise<System[]> {
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

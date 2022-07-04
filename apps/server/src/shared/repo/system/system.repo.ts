import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { System } from '@shared/domain';
import { SystemScope } from '@shared/repo/system/system-scope';

@Injectable()
export class SystemRepo extends BaseRepo<System> {
	get entityName() {
		return System;
	}

	async findByFilter(type = '', onlyOauth = false): Promise<System[]> {
		const scope = new SystemScope();
		if (type) {
			scope.byType(type);
		}
		scope.withOauthConfigOnly(onlyOauth);
		return this._em.find(System, scope.query);
	}

	async findAll(): Promise<System[]> {
		return this._em.find(System, {});
	}
}

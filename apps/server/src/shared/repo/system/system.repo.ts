import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import {Account, System} from '@shared/domain';
import {ObjectId} from "@mikro-orm/mongodb";

@Injectable()
export class SystemRepo extends BaseRepo<System> {
	get entityName() {
		return System;
	}

	async findOauthSystems(): Promise<System[]> {
		return this._em.find(System, { oauthConfig: { $ne: null }});
	}
}

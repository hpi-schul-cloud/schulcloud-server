import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { DemoSchool } from '../domain';

@Injectable()
export class DemoSchoolRepo {
	constructor(private readonly em: EntityManager) {}

	async save(school: DemoSchool): Promise<void> {
		// TODO map to entity and actually persist
		return Promise.resolve();
	}
}

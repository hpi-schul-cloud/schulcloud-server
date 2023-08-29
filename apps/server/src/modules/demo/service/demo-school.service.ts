import { Injectable } from '@nestjs/common';
import { ObjectId } from 'bson';
import { DemoSchool } from '../domain';
import { DemoSchoolRepo } from '../repo/demo-school.repo';

@Injectable()
export class DemoSchoolService {
	constructor(private readonly repo: DemoSchoolRepo) {}

	async createSchool(): Promise<DemoSchool> {
		const school = new DemoSchool({
			id: new ObjectId().toHexString(),
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await this.repo.save(school);

		return school;
	}
}

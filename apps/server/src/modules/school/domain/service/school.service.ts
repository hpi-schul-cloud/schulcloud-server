import { Inject, Injectable } from '@nestjs/common';
import { SchoolRepo, SCHOOL_REPO } from '../interface';
import { School } from '../school';

@Injectable()
export class SchoolService {
	constructor(@Inject(SCHOOL_REPO) private readonly schoolRepo: SchoolRepo) {}

	public async getAllSchools(): Promise<School[]> {
		const schools = await this.schoolRepo.getAllSchools();

		return schools;
	}
}

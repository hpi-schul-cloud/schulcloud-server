import { Injectable } from '@nestjs/common';
import { School } from '../school';
import { SchoolService } from '../service/school.service';

@Injectable()
export class SchoolUc {
	constructor(private readonly schoolService: SchoolService) {}

	public async getAllSchools(): Promise<School[]> {
		const schools = await this.schoolService.getAllSchools();

		return schools;
	}
}

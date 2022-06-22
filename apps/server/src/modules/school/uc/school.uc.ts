import { Injectable } from '@nestjs/common';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { SchoolService } from '@src/modules/school/service/school.service';

@Injectable()
export class SchoolUc {
	constructor(readonly schoolService: SchoolService) {}

	async saveSchool(schoolDto: SchoolDto) {
		await this.schoolService.saveSchool(schoolDto);
	}
}

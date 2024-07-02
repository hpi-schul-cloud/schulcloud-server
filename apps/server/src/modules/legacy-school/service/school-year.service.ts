import { Injectable } from '@nestjs/common';
import { SchoolYearEntity } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { SchoolYearRepo } from '../repo';

@Injectable()
export class SchoolYearService {
	constructor(private readonly schoolYearRepo: SchoolYearRepo) {}

	// TODO: N21-990 Refactoring: Create domain objects for schoolYear and federalState
	async getCurrentSchoolYear(): Promise<SchoolYearEntity> {
		const current: SchoolYearEntity = await this.schoolYearRepo.findCurrentYear();

		return current;
	}

	async getCurrentOrNextSchoolYear(): Promise<SchoolYearEntity> {
		const current: SchoolYearEntity = await this.schoolYearRepo.findCurrentOrNextYear();

		return current;
	}

	async findById(id: EntityId): Promise<SchoolYearEntity> {
		const year: SchoolYearEntity = await this.schoolYearRepo.findById(id);

		return year;
	}
}

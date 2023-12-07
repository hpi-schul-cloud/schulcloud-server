import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { SchoolSystemOptions } from '../domain';
import { SchoolSystemOptionsRepo } from '../repo';

@Injectable()
export class SchoolSystemOptionsService {
	constructor(private readonly schoolSystemOptionsRepo: SchoolSystemOptionsRepo) {}

	public async findBySchoolIdAndSystemId(schoolId: EntityId, systemId: EntityId): Promise<SchoolSystemOptions | null> {
		const schoolSystemOptions: SchoolSystemOptions | null =
			await this.schoolSystemOptionsRepo.findBySchoolIdAndSystemId(schoolId, systemId);

		return schoolSystemOptions;
	}

	public async save(schoolSystemOptions: SchoolSystemOptions): Promise<SchoolSystemOptions> {
		const savedSchoolSystemOptions: SchoolSystemOptions = await this.schoolSystemOptionsRepo.save(schoolSystemOptions);

		return savedSchoolSystemOptions;
	}
}

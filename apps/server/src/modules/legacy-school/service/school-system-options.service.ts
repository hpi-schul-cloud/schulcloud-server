import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AnyProvisioningOptions, SchoolSystemOptions } from '../domain';
import { InvalidProvisioningOptionsTypeLoggableException } from '../loggable';
import { SchoolSystemOptionsRepo } from '../repo';

@Injectable()
export class SchoolSystemOptionsService {
	constructor(private readonly schoolSystemOptionsRepo: SchoolSystemOptionsRepo) {}

	public async findBySchoolIdAndSystemId(schoolId: EntityId, systemId: EntityId): Promise<SchoolSystemOptions | null> {
		const schoolSystemOptions: SchoolSystemOptions | null =
			await this.schoolSystemOptionsRepo.findBySchoolIdAndSystemId(schoolId, systemId);

		return schoolSystemOptions;
	}

	public async getProvisioningOptions<T extends AnyProvisioningOptions>(
		ProvisioningOptionsConstructor: new () => T,
		schoolId: EntityId,
		systemId: EntityId
	): Promise<T> {
		const schoolSystemOptions: SchoolSystemOptions | null =
			await this.schoolSystemOptionsRepo.findBySchoolIdAndSystemId(schoolId, systemId);

		let options: T;
		if (schoolSystemOptions) {
			if (!(schoolSystemOptions.provisioningOptions instanceof ProvisioningOptionsConstructor)) {
				throw new InvalidProvisioningOptionsTypeLoggableException(ProvisioningOptionsConstructor, schoolId, systemId);
			}

			options = schoolSystemOptions.provisioningOptions;
		} else {
			const defaultOptions: T = new ProvisioningOptionsConstructor();

			options = defaultOptions;
		}

		return options;
	}

	public async save(schoolSystemOptions: SchoolSystemOptions): Promise<SchoolSystemOptions> {
		const savedSchoolSystemOptions: SchoolSystemOptions = await this.schoolSystemOptionsRepo.save(schoolSystemOptions);

		return savedSchoolSystemOptions;
	}
}

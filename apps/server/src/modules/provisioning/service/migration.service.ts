import { Injectable } from '@nestjs/common';
import { SchoolService } from '../../school';
import { SystemService } from '../../system/service/system.service';
import { MigrationResponse } from '../../school/controller/dto';
import { SystemDto } from '../../system/service/dto/system.dto';
import { MigrationStrategy } from '@shared/domain/interface/migration-strategy.enum';
import { MigrationOutputDto } from '../dto/migration-output.dto';

@Injectable()
export class MigrationService {
	constructor(private readonly systemService: SystemService, private readonly schoolService: SchoolService) {}

	async isSchoolInMigration(externalSchoolId: string): Promise<MigrationOutputDto> {
		const migration: MigrationResponse = await this.schoolService.getMigration(externalSchoolId);

		return migration;
	}

	async getMigrationStrategy(migrationPossible: boolean, migrationMandatory: boolean  ,systemId: string){
		const system : SystemDto = await this.systemService.findById(systemId);
		let redirect = '';
		if(system.type === MigrationStrategy.SANIS && migrationPossible){

			return redirect

		}
		return redirect
	}

}

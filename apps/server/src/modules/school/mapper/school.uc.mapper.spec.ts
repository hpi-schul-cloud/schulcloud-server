import { SchoolUcMapper } from '@src/modules/school/mapper/school.uc.mapper';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { PublicSchoolResponse } from '../controller/dto/public.school.response';

describe('SchoolUcMapper', () => {
	describe('when it maps from a ProvisioningSchoolOutputDto to a SchoolDO', () => {
		it('should map all fields', () => {
			const dto: ProvisioningSchoolOutputDto = new ProvisioningSchoolOutputDto({
				name: '123',
				externalId: 'external1234',
				systemIds: ['systemId'],
			});

			const result = SchoolUcMapper.mapFromProvisioningSchoolOutputDtoToSchoolDO(dto);

			expect(result.id).toEqual(dto.id);
			expect(result.name).toEqual(dto.name);
			expect(result.externalId).toEqual(dto.externalId);
			expect(result.systems).toEqual(dto.systemIds);
		});
	});

	describe('when it maps from a SchoolDO to a PublicSchoolResponse', () => {
		it('should map all fields', () => {
			const schoolDO: SchoolDO = new SchoolDO({
				name: 'Testschool',
				officialSchoolNumber: '1234',
				oauthMigrationPossible: true,
				oauthMigrationMandatory: false,
			});

			const result: PublicSchoolResponse = SchoolUcMapper.mapDOToPublicResponse(schoolDO);

			expect(result.schoolName).toEqual(schoolDO.name);
			expect(result.schoolNumber).toEqual(schoolDO.officialSchoolNumber);
			expect(result.oauthMigrationPossible).toEqual(schoolDO.oauthMigrationPossible);
			expect(result.oauthMigrationMandatory).toEqual(schoolDO.oauthMigrationMandatory);
		});
	});
});

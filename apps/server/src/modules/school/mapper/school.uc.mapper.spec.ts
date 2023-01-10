import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { PublicSchoolResponse } from '../controller/dto/public.school.response';
import { SchoolUcMapper } from './school.uc.mapper';

describe('SchoolUcMapper', () => {
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

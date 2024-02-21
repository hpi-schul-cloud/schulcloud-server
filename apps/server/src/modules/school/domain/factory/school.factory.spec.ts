import { LanguageType } from '@shared/domain/entity';
import { SchoolFeature } from '@shared/domain/types';
import { federalStateFactory } from '../../testing';
import { School } from '../do';
import { FileStorageType } from '../type';
import { SchoolFactory } from './school.factory';

describe('SchoolFactory', () => {
	describe('buildFromPartialBody', () => {
		const buildSchool = () => {
			const school = new School({
				id: 'school-id',
				name: 'school-name',
				officialSchoolNumber: 'school-number',
				logo_dataUrl: 'school-logo-dataUrl',
				logo_name: 'school-logo-name',
				fileStorageType: FileStorageType.AWS_S3,
				language: LanguageType.DE,
				features: new Set([SchoolFeature.ENABLE_LDAP_SYNC_DURING_MIGRATION]),
				createdAt: new Date(),
				updatedAt: new Date(),
				federalState: federalStateFactory.build(),
			});

			return school;
		};

		describe('when the partialBody is empty object', () => {
			const setup = () => {
				const school = buildSchool();
				const partialBody = {};

				return { school, partialBody };
			};

			it('should return the same school', () => {
				const { school, partialBody } = setup();

				const result = SchoolFactory.buildFromPartialBody(school, partialBody);

				expect(result).toEqual(school);
			});
		});

		describe('when the partialBody has all properties', () => {
			const setup = () => {
				const school = buildSchool();
				const partialBody = {
					name: 'new-school-name',
					officialSchoolNumber: 'new-school-number',
					logo_dataUrl: 'new-school-logo-dataUrl',
					logo_name: 'new-school-logo-name',
					fileStorageType: FileStorageType.AWS_S3,
					language: LanguageType.EN,
					features: new Set([SchoolFeature.IS_TEAM_CREATION_BY_STUDENTS_ENABLED]),
				};

				return { school, partialBody };
			};

			it('should return a new school with the new properties', () => {
				const { school, partialBody } = setup();

				const result = SchoolFactory.buildFromPartialBody(school, partialBody);

				expect(result.getProps().name).toBe(partialBody.name);
				expect(result.getProps().officialSchoolNumber).toBe(partialBody.officialSchoolNumber);
				expect(result.getProps().logo_dataUrl).toBe(partialBody.logo_dataUrl);
				expect(result.getProps().logo_name).toBe(partialBody.logo_name);
				expect(result.getProps().fileStorageType).toBe(partialBody.fileStorageType);
				expect(result.getProps().language).toBe(partialBody.language);
				expect(result.getProps().features).toEqual(partialBody.features);
			});
		});
	});
});

import { MediaSource } from '@modules/media-source';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { MediaSourceMapper } from '@modules/media-source/repo';
import { School } from '@modules/school';
import { SchoolEntityMapper } from '@modules/school/repo';
import { MediaSchoolLicense } from '../../domain';
import { mediaSchoolLicenseEntityFactory, mediaSchoolLicenseFactory } from '../../testing';
import { MediaSchoolLicenseEntityMapper } from './media-school-license.entity.mapper';

describe(MediaSchoolLicenseEntityMapper.name, () => {
	describe('mapEntityToDo', () => {
		describe('when a media school license entity is given', () => {
			const setup = () => {
				const mediaSchoolLicenseEntity = mediaSchoolLicenseEntityFactory.build();

				const mediaSourceEntity: MediaSourceEntity = mediaSchoolLicenseEntity.mediaSource as MediaSourceEntity;

				const mediaSource: MediaSource = MediaSourceMapper.mapEntityToDo(mediaSourceEntity);
				const school: School = SchoolEntityMapper.mapToDo(mediaSchoolLicenseEntity.school);

				const expectedDomainObject = mediaSchoolLicenseFactory.build({
					id: mediaSchoolLicenseEntity.id,
					type: mediaSchoolLicenseEntity.type,
					mediumId: mediaSchoolLicenseEntity.mediumId,
					schoolId: school.id,
					mediaSource,
				});

				return { mediaSchoolLicenseEntity, expectedDomainObject };
			};

			it('should return the domain object of the entity', () => {
				const { mediaSchoolLicenseEntity, expectedDomainObject } = setup();

				const domainObject: MediaSchoolLicense = MediaSchoolLicenseEntityMapper.mapEntityToDO(mediaSchoolLicenseEntity);

				expect(domainObject).toEqual(expectedDomainObject);
			});
		});
	});
});

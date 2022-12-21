import { SchoolMapper } from '@src/modules/school/mapper/school.mapper';
import { ISchoolProperties, School, SchoolFeatures, SchoolYear, System } from '@shared/domain';
import { schoolFactory, setupEntities, systemFactory } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { EntityProperties } from '@shared/repo';
import { schoolYearFactory } from '@shared/testing/factory/schoolyear.factory';

describe('SchoolMapper', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	it('mapToDO', () => {
		const schoolEntity: School = schoolFactory.buildWithId();
		const system: System = systemFactory.buildWithId();
		schoolEntity.systems.add(system);

		const schoolDO = SchoolMapper.mapEntityToDO(schoolEntity);

		expect(schoolDO.id).toEqual(schoolEntity.id);
		expect(schoolDO.name).toEqual(schoolEntity.name);
		expect(schoolDO.externalId).toEqual(schoolEntity.externalId);
		expect(schoolDO.features).toEqual(schoolEntity.features);
		expect(schoolDO.systems ? schoolDO.systems[0] : '').toEqual(schoolEntity.systems ? schoolEntity.systems[0].id : '');
		expect(schoolDO.officialSchoolNumber).toEqual(schoolEntity.officialSchoolNumber);
		expect(schoolDO.oauthMigrationPossible).toEqual(schoolEntity.oauthMigrationPossible);
		expect(schoolDO.inUserMigration).toEqual(schoolEntity.inUserMigration);
		expect(schoolDO.inMaintenanceSince).toEqual(schoolEntity.inMaintenanceSince);
		expect(schoolDO.schoolYear).toEqual(schoolEntity.schoolYear);
	});

	it('mapToEntity', () => {
		const system: System = systemFactory.buildWithId();
		jest.mock('@mikro-orm/core/', () => {
			return jest.fn().mockImplementation(() => {
				return { createFromPK: jest.fn().mockReturnValue(system) };
			});
		});
		const schoolYear: SchoolYear = schoolYearFactory.build();
		const schoolDO: SchoolDO = new SchoolDO({
			id: new ObjectId().toHexString(),
			name: 'schoolName',
			externalId: 'externalId',
			features: [SchoolFeatures.NEXTCLOUD],
			inMaintenanceSince: new Date(),
			inUserMigration: false,
			oauthMigrationMandatory: true,
			oauthMigrationPossible: true,
			officialSchoolNumber: 'School1',
			schoolYear,
			systems: [system.id],
		});

		const entity: EntityProperties<ISchoolProperties> = SchoolMapper.mapDOToEntityProperties(schoolDO);

		expect(entity.id).toEqual(schoolDO.id);
		expect(entity.name).toEqual(schoolDO.name);
		expect(entity.externalId).toEqual(schoolDO.externalId);
		expect(entity.features).toEqual(schoolDO.features);
		expect(entity.systems ? entity.systems[0].id : '').toEqual(schoolDO.systems ? schoolDO.systems[0] : '');
		expect(entity.officialSchoolNumber).toEqual(schoolDO.officialSchoolNumber);
		expect(entity.oauthMigrationPossible).toEqual(schoolDO.oauthMigrationPossible);
		expect(entity.inUserMigration).toEqual(schoolDO.inUserMigration);
		expect(entity.inMaintenanceSince).toEqual(schoolDO.inMaintenanceSince);
		expect(entity.schoolYear).toEqual(schoolDO.schoolYear);

		jest.clearAllMocks();
	});
});

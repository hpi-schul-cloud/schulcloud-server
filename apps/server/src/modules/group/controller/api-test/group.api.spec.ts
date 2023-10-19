import { EntityManager } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, RoleName, SchoolEntity, SchoolYearEntity, SortOrder, SystemEntity, User } from '@shared/domain';
import {
	groupEntityFactory,
	roleFactory,
	schoolFactory,
	schoolYearFactory,
	systemFactory,
	TestApiClient,
	UserAndAccountTestFactory,
	userFactory,
} from '@shared/testing';
import { ClassEntity } from '@src/modules/class/entity';
import { classEntityFactory } from '@src/modules/class/entity/testing/factory/class.entity.factory';
import { ServerTestModule } from '@src/modules/server';
import { GroupEntity, GroupEntityTypes } from '../../entity';
import { ClassRootType } from '../../uc/dto/class-root-type';
import { ClassInfoSearchListResponse, ClassSortBy } from '../dto';

const baseRouteName = '/groups';

describe('Group (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('findClassesForSchool', () => {
		describe('when an admin requests a list of classes', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolFactory.buildWithId();
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				const teacherRole: Role = roleFactory.buildWithId({ name: RoleName.TEACHER });
				const teacherUser: User = userFactory.buildWithId({ school, roles: [teacherRole] });
				const system: SystemEntity = systemFactory.buildWithId();
				const schoolYear: SchoolYearEntity = schoolYearFactory.buildWithId();
				const clazz: ClassEntity = classEntityFactory.buildWithId({
					name: 'Group A',
					schoolId: school._id,
					teacherIds: [teacherUser._id],
					source: undefined,
					year: schoolYear.id,
				});
				const group: GroupEntity = groupEntityFactory.buildWithId({
					name: 'Group B',
					type: GroupEntityTypes.CLASS,
					externalSource: {
						externalId: 'externalId',
						system,
					},
					organization: school,
					users: [
						{
							user: adminUser,
							role: teacherRole,
						},
					],
				});

				await em.persistAndFlush([
					school,
					adminAccount,
					adminUser,
					teacherRole,
					teacherUser,
					system,
					clazz,
					group,
					schoolYear,
				]);
				em.clear();

				const adminClient = await testApiClient.login(adminAccount);

				return {
					adminClient,
					group,
					clazz,
					system,
					adminUser,
					teacherUser,
					schoolYear,
				};
			};

			it('should return the classes of his school', async () => {
				const { adminClient, group, clazz, system, adminUser, teacherUser, schoolYear } = await setup();

				const response = await adminClient.get(`/class`).query({
					skip: 0,
					limit: 2,
					sortBy: ClassSortBy.NAME,
					sortOrder: SortOrder.desc,
				});

				expect(response.body).toEqual<ClassInfoSearchListResponse>({
					total: 2,
					data: [
						{
							id: group.id,
							type: ClassRootType.GROUP,
							name: group.name,
							externalSourceName: system.displayName,
							teachers: [adminUser.lastName],
						},
						{
							id: clazz.id,
							type: ClassRootType.CLASS,
							name: clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name,
							teachers: [teacherUser.lastName],
							schoolYear: schoolYear.name,
						},
					],
					skip: 0,
					limit: 2,
				});
			});
		});

		describe('when an invalid user requests a list of classes', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const studentClient = await testApiClient.login(studentAccount);

				return {
					studentClient,
				};
			};

			it('should return forbidden', async () => {
				const { studentClient } = await setup();

				const response = await studentClient.get(`/class`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});
	});
});

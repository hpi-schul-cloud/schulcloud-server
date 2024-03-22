import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { Account, Role, SchoolEntity, SchoolYearEntity, User } from '@shared/domain/entity';
import { accountFactory, roleFactory, schoolEntityFactory, schoolYearFactory, userFactory } from '@shared/testing';
import { Permission, RoleName } from '@shared/domain/interface';
import { ObjectId } from '@mikro-orm/mongodb';
import { EntityManager } from '@mikro-orm/core';
import { classEntityFactory } from '../../../class/entity/testing';
import { UserListResponse, UserResponse, UsersSearchQueryParams } from '../controller/dto';
import { UsersAdminRepo } from './users-admin.repo';

describe('users admin repo', () => {
	let module: TestingModule;
	let repo: UsersAdminRepo;

	let em: EntityManager;

	let adminAccount: Account;
	let studentAccount1: Account;
	let studentAccount2: Account;

	let adminUser: User;
	let studentUser1: User;
	let studentUser2: User;

	let studentRole: Role;
	let currentYear: SchoolYearEntity;
	let school: SchoolEntity;

	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

	const setupDb = async () => {
		currentYear = schoolYearFactory.withStartYear(2002).buildWithId();
		school = schoolEntityFactory.buildWithId({ currentYear });

		const adminRoles = roleFactory.build({
			name: RoleName.ADMINISTRATOR,
			permissions: [Permission.STUDENT_LIST],
		});
		studentRole = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });

		adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
		studentUser1 = userFactory.buildWithId({
			firstName: 'Marla',
			school,
			roles: [studentRole],
			consent: {
				userConsent: {
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: new Date('2017-01-01T00:06:37.148Z'),
					dateOfTermsOfUseConsent: new Date('2017-01-01T00:06:37.148Z'),
				},
				parentConsents: [
					{
						_id: new ObjectId('5fa31aacb229544f2c697b48'),
						form: 'digital',
						privacyConsent: true,
						termsOfUseConsent: true,
						dateOfPrivacyConsent: new Date('2017-01-01T00:06:37.148Z'),
						dateOfTermsOfUseConsent: new Date('2017-01-01T00:06:37.148Z'),
					},
				],
			},
		});

		studentUser2 = userFactory.buildWithId({
			firstName: 'Test',
			school,
			roles: [studentRole],
			consent: {
				userConsent: {
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: new Date('2017-01-01T00:06:37.148Z'),
					dateOfTermsOfUseConsent: new Date('2017-01-01T00:06:37.148Z'),
				},
			},
		});

		const studentClass = classEntityFactory.buildWithId({
			name: 'Group A',
			schoolId: school.id,
			year: currentYear.id,
			userIds: [studentUser1._id],
			gradeLevel: 12,
		});

		const mapUserToAccount = (user: User): Account =>
			accountFactory.buildWithId({
				userId: user.id,
				username: user.email,
				password: defaultPasswordHash,
			});
		adminAccount = mapUserToAccount(adminUser);
		studentAccount1 = mapUserToAccount(studentUser1);
		studentAccount2 = mapUserToAccount(studentUser2);

		em.persist(school);
		em.persist(currentYear);
		em.persist([adminRoles, studentRole]);
		em.persist([adminUser, studentUser1, studentUser2]);
		em.persist([adminAccount, studentAccount1, studentAccount2]);
		em.persist(studentClass);
		await em.flush();
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [UsersAdminRepo],
		}).compile();
		repo = module.get(UsersAdminRepo);
		em = module.get(EntityManager);

		await setupDb();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.getUserByIdWithNestedData).toEqual('function');
		expect(typeof repo.getUsersWithNestedData).toEqual('function');
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(User);
	});

	describe('when student exists', () => {
		it('should return student ', async () => {
			const response = await repo.getUserByIdWithNestedData(studentRole.id, school.id, currentYear.id, studentUser1.id);

			const userResponse = response as UserResponse[];

			expect(userResponse[0]._id.toString()).toBe(studentUser1._id.toString());
			expect(userResponse[0].firstName).toBe(studentUser1.firstName);
			expect(userResponse[0].lastName).toBe(studentUser1.lastName);
			expect(userResponse[0].consentStatus).toBe('ok');
		});
	});

	describe('when sort param is provided', () => {
		const setup = () => {
			const query: UsersSearchQueryParams = {
				$skip: 0,
				$limit: 5,
				$sort: { firstName: 1 },
			};

			return {
				query,
			};
		};

		it('should return students in correct order', async () => {
			const { query } = setup();
			const response = await repo.getUsersWithNestedData(studentRole.id, school.id, currentYear.id, query);

			const userListResponse = response as UserListResponse[];
			const data = userListResponse[0].data;

			expect(userListResponse[0].total).toBe(2);
			expect(data.length).toBe(2);
			expect(data[0]._id.toString()).toBe(studentUser1._id.toString());
			expect(data[1]._id.toString()).toBe(studentUser2._id.toString());
		});
	});

	describe('when sorting by classes', () => {
		const setup = () => {
			const query: UsersSearchQueryParams = {
				$skip: 0,
				$limit: 5,
				$sort: { classes: 1 },
			};

			return {
				query,
			};
		};

		it('should return students', async () => {
			const { query } = setup();
			const response = await repo.getUsersWithNestedData(studentRole.id, school.id, currentYear.id, query);

			const userListResponse = response as UserListResponse[];
			const data = userListResponse[0].data;

			expect(userListResponse[0].total).toBe(2);
			expect(data.length).toBe(2);
		});
	});

	describe('when sorting by consentStatus', () => {
		const setup = () => {
			const query: UsersSearchQueryParams = {
				$skip: 0,
				$limit: 5,
				$sort: { consentStatus: 1 },
			};

			return {
				query,
			};
		};

		it('should return students', async () => {
			const { query } = setup();
			const response = await repo.getUsersWithNestedData(studentRole.id, school.id, currentYear.id, query);

			const userListResponse = response as UserListResponse[];
			const data = userListResponse[0].data;

			expect(userListResponse[0].total).toBe(2);
			expect(data.length).toBe(2);
		});
	});

	describe('when search params are too tight', () => {
		const setup = () => {
			const query: UsersSearchQueryParams = {
				$skip: 0,
				$limit: 5,
				$sort: { firstName: 1 },
				classes: ['1A', '2A'],
				consentStatus: { $in: ['ok', 'parentsAgreed', 'missing'] },
				createdAt: {
					$gt: new Date('2024-02-08T23:00:00Z'),
					$gte: new Date('2024-02-08T23:00:00Z'),
					$lt: new Date('2024-02-08T23:00:00Z'),
					$lte: new Date('2024-02-08T23:00:00Z'),
				},
				lastLoginSystemChange: {
					$gt: new Date('2024-02-08T23:00:00Z'),
					$gte: new Date('2024-02-08T23:00:00Z'),
					$lt: new Date('2024-02-08T23:00:00Z'),
					$lte: new Date('2024-02-08T23:00:00Z'),
				},
				outdatedSince: {
					$gt: new Date('2024-02-08T23:00:00Z'),
					$gte: new Date('2024-02-08T23:00:00Z'),
					$lt: new Date('2024-02-08T23:00:00Z'),
					$lte: new Date('2024-02-08T23:00:00Z'),
				},
			};

			return {
				query,
			};
		};

		it('should return empty list', async () => {
			const { query } = setup();
			const response = await repo.getUsersWithNestedData(studentRole.id, school.id, currentYear.id, query);

			const userListResponse = response as UserListResponse[];
			const data = userListResponse[0].data;

			expect(userListResponse[0].total).toBe(0);
			expect(data.length).toBe(0);
		});
	});

	describe('when skip params are too big', () => {
		const setup = () => {
			const query: UsersSearchQueryParams = {
				$skip: 50000,
				$limit: 5,
				$sort: { firstName: 1 },
			};

			return {
				query,
			};
		};

		it('should return empty list', async () => {
			const { query } = setup();
			const response = await repo.getUsersWithNestedData(studentRole.id, school.id, currentYear.id, query);

			const userListResponse = response as UserListResponse[];
			const data = userListResponse[0].data;

			expect(data.length).toBe(0);
			expect(userListResponse[0].total).toBe(2);
		});
	});
});

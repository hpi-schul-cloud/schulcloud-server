import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import {
	accountFactory,
	mapUserToCurrentUser,
	roleFactory,
	schoolEntityFactory,
	schoolYearFactory,
	userFactory,
} from '@shared/testing';
import { AccountEntity } from '@src/modules/account/entity/account.entity';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { Request } from 'express';
import request from 'supertest';
import { classEntityFactory } from '../../../../class/entity/testing';
import { UserListResponse, UserResponse, UsersSearchQueryParams } from '../dto';

describe('Users Admin Students Controller (API)', () => {
	const basePath = '/users/admin/students';

	let app: INestApplication;
	let em: EntityManager;

	let adminAccount: AccountEntity;
	let studentAccount1: AccountEntity;
	let studentAccount2: AccountEntity;

	let adminUser: User;
	let studentUser1: User;
	let studentUser2: User;

	let currentUser: ICurrentUser;

	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

	const setupDb = async () => {
		const currentYear = schoolYearFactory.withStartYear(2002).buildWithId();
		const school = schoolEntityFactory.buildWithId({ currentYear });

		const adminRoles = roleFactory.build({
			name: RoleName.ADMINISTRATOR,
			permissions: [Permission.STUDENT_LIST],
		});
		const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });

		adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
		studentUser1 = userFactory.buildWithId({
			firstName: 'Marla',
			school,
			roles: [studentRoles],
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
			roles: [studentRoles],
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

		const mapUserToAccount = (user: User): AccountEntity =>
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
		em.persist([adminRoles, studentRoles]);
		em.persist([adminUser, studentUser1, studentUser2]);
		em.persist([adminAccount, studentAccount1, studentAccount2]);
		em.persist(studentClass);
		await em.flush();
	};

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser;
					return true;
				},
			})
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);

		await setupDb();
	});

	afterAll(async () => {
		await app.close();
		em.clear();
	});

	describe('[GET] :id', () => {
		describe('when student exists', () => {
			const setup = () => {
				currentUser = mapUserToCurrentUser(adminUser, adminAccount);
			};

			it('should return student ', async () => {
				setup();
				const response = await request(app.getHttpServer()) //
					.get(`${basePath}/${studentUser1.id}`)
					.expect(200);

				// eslint-disable-next-line @typescript-eslint/naming-convention
				const { _id } = response.body as UserResponse;

				expect(_id).toBe(studentUser1._id.toString());
			});
		});

		describe('when user has no right permission', () => {
			const setup = () => {
				currentUser = mapUserToCurrentUser(studentUser1, studentAccount1);
			};

			it('should reject request', async () => {
				setup();
				await request(app.getHttpServer()) //
					.get(`${basePath}/${studentUser1.id}`)
					.expect(403);
			});
		});

		describe('when student does not exists', () => {
			const setup = () => {
				currentUser = mapUserToCurrentUser(adminUser, adminAccount);
			};

			it('should reject request ', async () => {
				setup();
				await request(app.getHttpServer()) //
					.get(`${basePath}/000000000000000000000000`)
					.expect(404);
			});
		});
	});

	describe('[GET]', () => {
		describe('when sort param is provided', () => {
			const setup = () => {
				currentUser = mapUserToCurrentUser(adminUser, adminAccount);
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
				const response = await request(app.getHttpServer()) //
					.get(`${basePath}`)
					.query(query)
					.set('Accept', 'application/json')
					.expect(200);

				const { data, total } = response.body as UserListResponse;

				expect(total).toBe(2);
				expect(data.length).toBe(2);
				expect(data[0]._id).toBe(studentUser1._id.toString());
				expect(data[1]._id).toBe(studentUser2._id.toString());
			});
		});

		describe('when sorting by classes', () => {
			const setup = () => {
				currentUser = mapUserToCurrentUser(adminUser, adminAccount);
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
				const response = await request(app.getHttpServer()) //
					.get(`${basePath}`)
					.query(query)
					.set('Accept', 'application/json')
					.expect(200);

				const { data, total } = response.body as UserListResponse;

				expect(total).toBe(2);
				expect(data.length).toBe(2);
			});
		});

		describe('when sorting by consentStatus', () => {
			const setup = () => {
				currentUser = mapUserToCurrentUser(adminUser, adminAccount);
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
				const response = await request(app.getHttpServer()) //
					.get(`${basePath}`)
					.query(query)
					.set('Accept', 'application/json')
					.expect(200);

				const { data, total } = response.body as UserListResponse;

				expect(total).toBe(2);
				expect(data.length).toBe(2);
			});
		});

		describe('when searching for users by wrong params', () => {
			const setup = () => {
				currentUser = mapUserToCurrentUser(adminUser, adminAccount);
				const query: UsersSearchQueryParams = {
					$skip: 0,
					$limit: 5,
					$sort: { firstName: 1 },
					classes: ['1A'],
				};

				return {
					query,
				};
			};

			it('should return empty list', async () => {
				const { query } = setup();
				const response = await request(app.getHttpServer()) //
					.get(`${basePath}`)
					.query(query)
					.set('Accept', 'application/json')
					.expect(200);

				const { data, total } = response.body as UserListResponse;

				expect(total).toBe(0);
				expect(data.length).toBe(0);
			});
		});

		describe('when user has no right permission', () => {
			const setup = () => {
				currentUser = mapUserToCurrentUser(studentUser1, studentAccount1);
				const query: UsersSearchQueryParams = {
					$skip: 0,
					$limit: 5,
					$sort: { firstName: 1 },
				};

				return {
					query,
				};
			};

			it('should reject request', async () => {
				const { query } = setup();
				await request(app.getHttpServer()) //
					.get(`${basePath}`)
					.query(query)
					.send()
					.expect(403);
			});
		});
	});
});

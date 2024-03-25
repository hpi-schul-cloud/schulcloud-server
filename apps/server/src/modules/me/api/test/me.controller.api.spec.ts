import { EntityManager } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { User } from '@shared/domain/entity';
import { TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { AccountEntity } from '@modules/account/entity/account.entity';
import { ServerTestModule } from '@src/modules/server';
import { MeResponse } from '../dto';

const mapToMeResponseObject = (user: User, account: AccountEntity): MeResponse => {
	const permissions = user.resolvePermissions();
	const roles = user.getRoles();
	const role = roles[0];
	const { school } = user;

	const meResponseObject: MeResponse = {
		school: {
			id: school.id,
			name: school.name,
			logo: {},
		},
		user: {
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
		},
		roles: [
			{
				id: role.id,
				name: role.name,
			},
		],
		permissions,
		account: {
			id: account.id,
		},
	};

	return meResponseObject;
};

describe('Me Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'me');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('me', () => {
		describe('when no jwt is passed', () => {
			it('should respond with unauthorized exception', async () => {
				const response = await testApiClient.get();

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					type: 'UNAUTHORIZED',
					title: 'Unauthorized',
					message: 'Unauthorized',
					code: 401,
				});
			});
		});

		describe('when valid jwt is passed', () => {
			const setup = async () => {
				const { studentAccount: account, studentUser: user } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([account, user]);
				em.clear();

				const loggedInClient = await testApiClient.login(account);
				const expectedResponse = mapToMeResponseObject(user, account);

				return { loggedInClient, expectedResponse };
			};

			it('should respond with "me" information and status code 200', async () => {
				const { loggedInClient, expectedResponse } = await setup();

				const response = await loggedInClient.get();

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toEqual(expectedResponse);
			});
		});
	});
});

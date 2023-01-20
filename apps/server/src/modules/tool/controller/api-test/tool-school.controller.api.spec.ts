import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { ExternalTool, ICurrentUser, Permission, Role, RoleName, School, User } from '@shared/domain';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import request from 'supertest';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { externalToolFactory, roleFactory, schoolFactory, userFactory } from '@shared/testing';
import { SchoolExternalToolPostParams } from '../dto';

// TODO: remove
jest.setTimeout(999999);

describe('ToolSchoolController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let orm: MikroORM;

	let currentUser: ICurrentUser;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
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

		app = moduleRef.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		orm = app.get(MikroORM);
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await orm.getSchemaGenerator().clearDatabase();
	});

	const setup = async () => {
		const adminRole: Role = roleFactory.build({
			name: RoleName.ADMINISTRATOR,
			permissions: [Permission.SCHOOL_TOOL_ADMIN],
		});
		const school: School = schoolFactory.buildWithId();
		const adminUser: User = userFactory.buildWithId({ school, roles: [adminRole] });
		const externalTool: ExternalTool = externalToolFactory.buildWithId();

		em.persist([adminRole, school, adminUser, externalTool]);
		await em.flush();

		return {
			externalTool,
			school,
		};
	};

	describe('[POST] tools/school', () => {
		it('should create an school external tool', async () => {
			const { externalTool, school } = await setup();
			const postParams: SchoolExternalToolPostParams = {
				toolId: externalTool.id,
				schoolId: school.id,
				version: 1,
				parameters: [],
			};

			await request(app.getHttpServer()).post('/tools/school').send(postParams).expect('201');
		});
	});
});

import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalTool, Permission, Role, User } from '@shared/domain';
import { externalToolFactory, mapUserToCurrentUser, roleFactory, userFactory } from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server';
import { Request } from 'express';
import request, { Response } from 'supertest';
import {
	CustomParameterLocationParams,
	CustomParameterScopeParams,
	CustomParameterTypeParams,
	ToolConfigType,
} from '../../interface';
import { ExternalToolPostParams, ExternalToolResponse, ExternalToolSearchListResponse } from '../dto';

describe('ToolController (API)', () => {
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

	describe('[POST] tools', () => {
		const setup = async () => {
			const params: ExternalToolPostParams = {
				name: 'Tool 1',
				parameters: [
					{
						name: 'key',
						description: 'This is a parameter.',
						displayName: 'User Friendly Name',
						defaultValue: 'abc',
						isOptional: false,
						type: CustomParameterTypeParams.STRING,
						regex: 'abc',
						regexComment: 'Regex accepts "abc" as value.',
						location: CustomParameterLocationParams.PATH,
						scope: CustomParameterScopeParams.GLOBAL,
					},
				],
				config: {
					type: ToolConfigType.BASIC,
					baseUrl: 'https://link.to-my-tool.com/:key',
				},
				isHidden: false,
				logoUrl: 'https://link.to-my-logo.com',
				url: 'https://link.to-my-tool.com',
				openNewTab: true,
			};

			const role: Role = roleFactory.buildWithId({ permissions: [Permission.TOOL_ADMIN] });
			const user: User = userFactory.buildWithId({ roles: [role] });
			currentUser = mapUserToCurrentUser(user);

			await em.persistAndFlush(user);
			em.clear();

			return { params };
		};

		it('should create a tool', async () => {
			const { params } = await setup();

			const response: Response = await request(app.getHttpServer()).post('/tools').send(params).expect(201);
			const body: ExternalToolResponse = response.body as ExternalToolResponse;

			expect(await em.findOneOrFail(ExternalTool, { id: body.id }));
		});

		it('should return the created tool', async () => {
			const { params } = await setup();

			const response: Response = await request(app.getHttpServer()).post('/tools').send(params).expect(201);
			const body: ExternalToolResponse = response.body as ExternalToolResponse;

			expect(body.id).toBeDefined();
			expect(body).toEqual<ExternalToolResponse>({
				id: body.id,
				name: 'Tool 1',
				parameters: [
					{
						name: 'key',
						description: 'This is a parameter.',
						displayName: 'User Friendly Name',
						defaultValue: 'abc',
						isOptional: false,
						type: CustomParameterTypeParams.STRING,
						regex: 'abc',
						regexComment: 'Regex accepts "abc" as value.',
						location: CustomParameterLocationParams.PATH,
						scope: CustomParameterScopeParams.GLOBAL,
					},
				],
				config: {
					type: ToolConfigType.BASIC,
					baseUrl: 'https://link.to-my-tool.com/:key',
				},
				isHidden: false,
				logoUrl: 'https://link.to-my-logo.com',
				url: 'https://link.to-my-tool.com',
				openNewTab: true,
				version: 1,
			});
		});
	});

	describe('[GET] tools', () => {
		const setup = async () => {
			const toolId: string = new ObjectId().toHexString();
			const externalTool: ExternalTool = externalToolFactory.buildWithId(undefined, toolId);

			const role: Role = roleFactory.buildWithId({ permissions: [Permission.TOOL_ADMIN] });
			const user: User = userFactory.buildWithId({ roles: [role] });
			currentUser = mapUserToCurrentUser(user);

			await em.persistAndFlush([user, externalTool]);
			em.clear();

			return { toolId };
		};

		it('should get all tools', async () => {
			const { toolId } = await setup();

			const response: Response = await request(app.getHttpServer()).get(`/tools`).expect(200);

			expect(response.body).toEqual<ExternalToolSearchListResponse>({
				total: 1,
				skip: 0,
				limit: 10,
				data: [expect.objectContaining<Partial<ExternalToolResponse>>({ id: toolId }) as ExternalToolResponse],
			});
		});
	});

	describe('[GET] tools/:toolId', () => {
		const setup = async () => {
			const toolId: string = new ObjectId().toHexString();
			const externalTool: ExternalTool = externalToolFactory.buildWithId(undefined, toolId);

			const role: Role = roleFactory.buildWithId({ permissions: [Permission.TOOL_ADMIN] });
			const user: User = userFactory.buildWithId({ roles: [role] });
			currentUser = mapUserToCurrentUser(user);

			await em.persistAndFlush([user, externalTool]);
			em.clear();

			return { toolId };
		};

		it('should get a tool by id', async () => {
			const { toolId } = await setup();

			const response: Response = await request(app.getHttpServer()).get(`/tools/${toolId}`).expect(200);

			expect(response.body).toEqual<ExternalToolResponse>(
				expect.objectContaining<Partial<ExternalToolResponse>>({ id: toolId }) as ExternalToolResponse
			);
		});
	});

	describe('[POST] tools/:toolId', () => {
		const setup = async () => {
			const toolId: string = new ObjectId().toHexString();
			const externalTool: ExternalTool = externalToolFactory.buildWithId({ version: 1 }, toolId);

			const params: ExternalToolPostParams = {
				id: toolId,
				name: 'Tool 1',
				parameters: [
					{
						name: 'key',
						description: 'This is a parameter.',
						displayName: 'User Friendly Name',
						defaultValue: 'abc',
						isOptional: false,
						type: CustomParameterTypeParams.STRING,
						regex: 'abc',
						regexComment: 'Regex accepts "abc" as value.',
						location: CustomParameterLocationParams.PATH,
						scope: CustomParameterScopeParams.GLOBAL,
					},
				],
				config: {
					type: ToolConfigType.BASIC,
					baseUrl: 'https://link.to-my-tool.com/:key',
				},
				isHidden: false,
				logoUrl: 'https://link.to-my-logo.com',
				url: 'https://link.to-my-tool.com',
				openNewTab: true,
			};

			const role: Role = roleFactory.buildWithId({ permissions: [Permission.TOOL_ADMIN] });
			const user: User = userFactory.buildWithId({ roles: [role] });
			currentUser = mapUserToCurrentUser(user);

			await em.persistAndFlush([user, externalTool]);
			em.clear();

			return { params, toolId };
		};

		it('should update a tool', async () => {
			const { params, toolId } = await setup();

			const response: Response = await request(app.getHttpServer()).post(`/tools/${toolId}`).send(params).expect(201);
			const body: ExternalToolResponse = response.body as ExternalToolResponse;

			expect(await em.findOneOrFail(ExternalTool, { id: body.id }));
		});

		it('should return the updated tool', async () => {
			const { params, toolId } = await setup();

			const response: Response = await request(app.getHttpServer()).post(`/tools/${toolId}`).send(params).expect(201);
			const body: ExternalToolResponse = response.body as ExternalToolResponse;

			expect(body.id).toBeDefined();
			expect(body).toEqual<ExternalToolResponse>({
				id: body.id,
				name: 'Tool 1',
				parameters: [
					{
						name: 'key',
						description: 'This is a parameter.',
						displayName: 'User Friendly Name',
						defaultValue: 'abc',
						isOptional: false,
						type: CustomParameterTypeParams.STRING,
						regex: 'abc',
						regexComment: 'Regex accepts "abc" as value.',
						location: CustomParameterLocationParams.PATH,
						scope: CustomParameterScopeParams.GLOBAL,
					},
				],
				config: {
					type: ToolConfigType.BASIC,
					baseUrl: 'https://link.to-my-tool.com/:key',
				},
				isHidden: false,
				logoUrl: 'https://link.to-my-logo.com',
				url: 'https://link.to-my-tool.com',
				openNewTab: true,
				version: 2,
			});
		});
	});

	describe('[DELETE] tools/:toolId', () => {
		const setup = async () => {
			const toolId: string = new ObjectId().toHexString();
			const externalTool: ExternalTool = externalToolFactory.buildWithId(undefined, toolId);

			const role: Role = roleFactory.buildWithId({ permissions: [Permission.TOOL_ADMIN] });
			const user: User = userFactory.buildWithId({ roles: [role] });
			currentUser = mapUserToCurrentUser(user);

			await em.persistAndFlush([user, externalTool]);
			em.clear();

			return { toolId };
		};

		it('should delete a tool', async () => {
			const { toolId } = await setup();

			await request(app.getHttpServer()).delete(`/tools/${toolId}`).expect(200);

			expect(await em.findOne(ExternalTool, { id: toolId })).toBeNull();
		});
	});
});

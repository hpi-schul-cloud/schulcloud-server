import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
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
	CustomParameterScopeTypeParams,
	CustomParameterTypeParams,
	ToolConfigType,
} from '../../interface';
import { ExternalToolCreateParams, ExternalToolResponse, ExternalToolSearchListResponse } from '../dto';

describe('ToolController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let orm: MikroORM;

	let currentUser: ICurrentUser | undefined;

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
		const postParams: ExternalToolCreateParams = {
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
					scope: CustomParameterScopeTypeParams.GLOBAL,
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

		describe('when valid data is given', () => {
			const setup = async () => {
				const params: ExternalToolCreateParams = { ...postParams };

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
							scope: CustomParameterScopeTypeParams.GLOBAL,
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

		describe('when invalid data is given', () => {
			const setup = async () => {
				const role: Role = roleFactory.buildWithId({ permissions: [Permission.TOOL_ADMIN] });
				const user: User = userFactory.buildWithId({ roles: [role] });
				currentUser = mapUserToCurrentUser(user);

				await em.persistAndFlush(user);
				em.clear();
			};

			it('should return bad request', async () => {
				await setup();

				const response: Response = await request(app.getHttpServer()).post('/tools').send({ invalid: 'invalidData' });

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when user is not authenticated', () => {
			const setup = async () => {
				const params: ExternalToolCreateParams = { ...postParams };

				const role: Role = roleFactory.buildWithId({ permissions: [Permission.TOOL_ADMIN] });
				const user: User = userFactory.buildWithId({ roles: [role] });
				currentUser = undefined;

				await em.persistAndFlush(user);
				em.clear();

				return { params };
			};

			it('should return unauthorized', async () => {
				const { params } = await setup();

				const response: Response = await request(app.getHttpServer()).post('/tools').send(params);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when permission is missing', () => {
			const setup = async () => {
				const params: ExternalToolCreateParams = { ...postParams };

				const role: Role = roleFactory.buildWithId({ permissions: [] });
				const user: User = userFactory.buildWithId({ roles: [role] });
				currentUser = undefined;

				await em.persistAndFlush(user);
				em.clear();

				return { params };
			};

			it('should return unauthorized', async () => {
				const { params } = await setup();

				const response: Response = await request(app.getHttpServer()).post('/tools').send(params);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe('[GET] tools', () => {
		describe('when requesting tools', () => {
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

				const response: Response = await request(app.getHttpServer()).get('/tools').expect(200);

				expect(response.body).toEqual<ExternalToolSearchListResponse>({
					total: 1,
					skip: 0,
					limit: 10,
					data: [expect.objectContaining<Partial<ExternalToolResponse>>({ id: toolId }) as ExternalToolResponse],
				});
			});
		});

		describe('when user is not authenticated', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const externalTool: ExternalTool = externalToolFactory.buildWithId(undefined, toolId);

				const role: Role = roleFactory.buildWithId({ permissions: [Permission.TOOL_ADMIN] });
				const user: User = userFactory.buildWithId({ roles: [role] });
				currentUser = undefined;

				await em.persistAndFlush([user, externalTool]);
				em.clear();
			};

			it('should return unauthorized', async () => {
				await setup();

				const response: Response = await request(app.getHttpServer()).get('/tools');

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when permission is missing', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const externalTool: ExternalTool = externalToolFactory.buildWithId(undefined, toolId);

				const role: Role = roleFactory.buildWithId({ permissions: [] });
				const user: User = userFactory.buildWithId({ roles: [role] });
				currentUser = mapUserToCurrentUser(user);

				await em.persistAndFlush([user, externalTool]);
				em.clear();
			};

			it('should return unauthorized', async () => {
				await setup();

				const response: Response = await request(app.getHttpServer()).get('/tools');

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe('[GET] tools/:toolId', () => {
		describe('when toolId is given', () => {
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

		describe('when path param is not valid', () => {
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

			it('should return bad request', async () => {
				await setup();

				const response: Response = await request(app.getHttpServer()).get('/tools/287182hjs');

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when user is not authenticated', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const externalTool: ExternalTool = externalToolFactory.buildWithId(undefined, toolId);

				const role: Role = roleFactory.buildWithId({ permissions: [Permission.TOOL_ADMIN] });
				const user: User = userFactory.buildWithId({ roles: [role] });
				currentUser = undefined;

				await em.persistAndFlush([user, externalTool]);
				em.clear();

				return { toolId };
			};

			it('should return unauthorized', async () => {
				const { toolId } = await setup();

				const response: Response = await request(app.getHttpServer()).get(`/tools/${toolId}`);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when permission is missing', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const externalTool: ExternalTool = externalToolFactory.buildWithId(undefined, toolId);

				const role: Role = roleFactory.buildWithId({ permissions: [] });
				const user: User = userFactory.buildWithId({ roles: [role] });
				currentUser = mapUserToCurrentUser(user);

				await em.persistAndFlush([user, externalTool]);
				em.clear();

				return { toolId };
			};

			it('should return unauthorized', async () => {
				const { toolId } = await setup();

				const response: Response = await request(app.getHttpServer()).get(`/tools/${toolId}`);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe('[POST] tools/:toolId', () => {
		const postParams: ExternalToolCreateParams = {
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
					scope: CustomParameterScopeTypeParams.GLOBAL,
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

		describe('when valid data is given', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const params = { ...postParams, id: toolId };
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ version: 1 }, toolId);

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
							scope: CustomParameterScopeTypeParams.GLOBAL,
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

		describe('when path param is not valid', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const params = { ...postParams, id: toolId };
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ version: 1 }, toolId);

				const role: Role = roleFactory.buildWithId({ permissions: [Permission.TOOL_ADMIN] });
				const user: User = userFactory.buildWithId({ roles: [role] });
				currentUser = mapUserToCurrentUser(user);

				await em.persistAndFlush([user, externalTool]);
				em.clear();

				return { params, toolId };
			};

			it('should return bad request', async () => {
				const { params } = await setup();

				const response: Response = await request(app.getHttpServer()).post('/tools/287182hjs').send(params);

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when user is not authenticated', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const params = { ...postParams, id: toolId };
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ version: 1 }, toolId);

				const role: Role = roleFactory.buildWithId({ permissions: [Permission.TOOL_ADMIN] });
				const user: User = userFactory.buildWithId({ roles: [role] });
				currentUser = undefined;

				await em.persistAndFlush([user, externalTool]);
				em.clear();

				return { params, toolId };
			};

			it('should return unauthorized', async () => {
				const { params, toolId } = await setup();

				const response: Response = await request(app.getHttpServer()).post(`/tools/${toolId}`).send(params);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when permission is missing', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const params = { ...postParams, id: toolId };
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ version: 1 }, toolId);

				const role: Role = roleFactory.buildWithId({ permissions: [] });
				const user: User = userFactory.buildWithId({ roles: [role] });
				currentUser = undefined;

				await em.persistAndFlush([user, externalTool]);
				em.clear();

				return { params, toolId };
			};

			it('should return unauthorized', async () => {
				const { params, toolId } = await setup();

				const response: Response = await request(app.getHttpServer()).post(`/tools/${toolId}`).send(params);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe('[DELETE] tools/:toolId', () => {
		describe('when valid data is given', () => {
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

		describe('when path param is not valid', () => {
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

			it('should return bad request', async () => {
				await setup();

				const response: Response = await request(app.getHttpServer()).delete('/tools/asdf10202');

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when user is not authenticated', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const externalTool: ExternalTool = externalToolFactory.buildWithId(undefined, toolId);

				const role: Role = roleFactory.buildWithId({ permissions: [Permission.TOOL_ADMIN] });
				const user: User = userFactory.buildWithId({ roles: [role] });
				currentUser = undefined;

				await em.persistAndFlush([user, externalTool]);
				em.clear();

				return { toolId };
			};

			it('should return unauthorized', async () => {
				const { toolId } = await setup();

				const response: Response = await request(app.getHttpServer()).delete(`/tools/${toolId}`);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when permission is missing', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const externalTool: ExternalTool = externalToolFactory.buildWithId(undefined, toolId);

				const role: Role = roleFactory.buildWithId({ permissions: [] });
				const user: User = userFactory.buildWithId({ roles: [role] });
				currentUser = mapUserToCurrentUser(user);

				await em.persistAndFlush([user, externalTool]);
				em.clear();

				return { toolId };
			};

			it('should return unauthorized', async () => {
				const { toolId } = await setup();

				const response: Response = await request(app.getHttpServer()).delete(`/tools/${toolId}`);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});
});

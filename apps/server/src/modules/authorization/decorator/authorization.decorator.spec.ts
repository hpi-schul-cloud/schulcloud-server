import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { Controller, ExecutionContext, Get, INestApplication } from '@nestjs/common';
import { RequireRole } from '@src/modules/index';
import { ICurrentUser, RoleName } from '@shared/domain/index';
import { Test, TestingModule } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/core';
import { ServerTestModule } from '@src/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import request from 'supertest';
import { Request } from 'express';

@Controller('test_decorator_requireRole')
export class TestDecoratorRequireRoleController {
	@RequireRole(RoleName.SUPERHERO)
	@Authenticate('jwt')
	@Get('test')
	async test(): Promise<void> {
		return Promise.resolve();
	}

	@RequireRole(RoleName.SUPERHERO)
	@Get('testNoJwt')
	async testNoJwt(): Promise<void> {
		return Promise.resolve();
	}

	@RequireRole()
	@Authenticate('jwt')
	@Get('testNoRole')
	async testNoRole(): Promise<void> {
		return Promise.resolve();
	}
}

describe('AuthorizationDecorator', () => {
	let app: INestApplication;
	let currentUser: ICurrentUser;
	let module: TestingModule;
	let orm: MikroORM;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ServerTestModule],
			controllers: [TestDecoratorRequireRoleController],
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

		app = module.createNestApplication();
		await app.init();
		orm = app.get(MikroORM);
	});

	afterAll(async () => {
		await orm.close();
		await app.close();
		await module.close();
	});

	describe('RequireRole', () => {
		it('should throw with ForbiddenException if the user does not have the required role', async () => {
			currentUser = {
				user: {
					roles: [{ name: RoleName.USER }],
				},
			} as unknown as ICurrentUser;

			const response = await request(app.getHttpServer()).get('/test_decorator_requireRole/test');

			expect(response.statusCode).toEqual(403);
		});

		it('should accept if the user has the required role', async () => {
			currentUser = {
				user: {
					roles: [{ name: RoleName.SUPERHERO }],
				},
			} as unknown as ICurrentUser;

			const response = await request(app.getHttpServer()).get('/test_decorator_requireRole/test');

			expect(response.statusCode).toEqual(200);
		});

		it('should throw with UnauthorizedException if no jwt can be extracted from request context', async () => {
			const response = await request(app.getHttpServer()).get('/test_decorator_requireRole/testNoJwt');

			expect(response.statusCode).toEqual(401);
		});

		it('should accept if no role was defined', async () => {
			const response = await request(app.getHttpServer()).get('/test_decorator_requireRole/testNoRole');

			expect(response.statusCode).toEqual(200);
		});
	});
});

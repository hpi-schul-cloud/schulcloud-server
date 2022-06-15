/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	Controller,
	DynamicModule,
	ExecutionContext,
	ForbiddenException,
	Get,
	INestApplication,
	Module,
} from '@nestjs/common';
import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser } from '@shared/domain';
import { ServerTestModule } from '@src/server.module';
import { MikroORM } from '@mikro-orm/core';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { Authenticate, CurrentUser, JWT } from './auth.decorator';
/*
describe('[Authenticate] Decorator', () => {
	it('should fail when non-jwt strategy is set', () => {
		expect(() => Authenticate('foo' as unknown as 'jwt')).toThrow(ForbiddenException);
	});

	it('should fail when no strategy is set', () => {
		expect(() => Authenticate(undefined as unknown as 'jwt')).toThrow(ForbiddenException);
	});
});
*/
@Authenticate('jwt')
@Controller('test_decorator_currentUser')
export class TestDecoratorCurrentUserController {
	@Get('test')
	async test(@CurrentUser() currentUser: ICurrentUser): Promise<void> {
		return Promise.resolve();
	}
}

@Authenticate('jwt')
@Controller('test_decorator_JWT')
export class TestDecoratorJWTController {
	@Get('test')
	async test(@JWT() jwt: string): Promise<void> {
		return Promise.resolve();
	}
}

describe('auth.decorator', () => {
	/*	describe('JWT', () => {
		let app: INestApplication;
		let module: TestingModule;
		let orm: MikroORM;

		beforeAll(async () => {
			module = await Test.createTestingModule({
				imports: [ServerTestModule],
				controllers: [TestDecoratorJWTController],
			})
				.overrideGuard(JwtAuthGuard)
				.useValue({
					canActivate(context: ExecutionContext) {
						const req: Request = context.switchToHttp().getRequest();
						// @ts-expect-error Testcase
						req.user = undefined;
						return true;
					},
				})
				.compile();

			app = module.createNestApplication();
			await app.init();
			orm = app.get(MikroORM);
		});

		afterAll(async () => {
			await app.close();
			await orm.close();
			await module.close();
		});

		it('should throw with UnauthorizedException if no jwt can be extracted from request context', async () => {
			const response = await request(app.getHttpServer()).get('test_decorator_JWT/test');

			expect(response.statusCode).toEqual(401);
		});
	});
*/

	describe('CurrentUser', () => {
		let app: INestApplication;
		let currentUser: ICurrentUser;
		let module: TestingModule;
		let orm: MikroORM;

		beforeAll(async () => {
			module = await Test.createTestingModule({
				imports: [ServerTestModule],
				controllers: [TestDecoratorCurrentUserController],
			})
				.overrideGuard(JwtAuthGuard)
				.useValue({
					canActivate(context: ExecutionContext) {
						const req: Request = context.switchToHttp().getRequest();
						// @ts-expect-error Testcase
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

		it('should throw with UnauthorizedException if no jwt user data can be extracted from request context', async () => {
			// @ts-expect-error Testcase
			currentUser = undefined;

			const response = await request(app.getHttpServer()).get('/test_decorator_currentUser/test');

			expect(response.statusCode).toEqual(401);
		});
	});
});

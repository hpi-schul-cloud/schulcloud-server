/* eslint-disable @typescript-eslint/no-unused-vars */
import { ServerTestModule } from '@modules/server/server.module';
import { Controller, ExecutionContext, Get, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../guard';
import { ICurrentUser } from '../interface';
import { CurrentUser, JWT, JwtAuthentication } from './jwt-auth.decorator';

@JwtAuthentication()
@Controller('test_decorator_currentUser')
export class TestDecoratorCurrentUserController {
	@Get('test')
	async test(@CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await Promise.resolve(currentUser);
	}
}

@JwtAuthentication()
@Controller('test_decorator_JWT')
export class TestDecoratorJWTController {
	@Get('test')
	async test(@JWT() jwt: string): Promise<void> {
		await Promise.resolve(jwt);
	}
}

describe('Jwt auth decorator', () => {
	let app: INestApplication;
	let currentUser: ICurrentUser;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ServerTestModule],
			controllers: [
				TestDecoratorCurrentUserController,
				TestDecoratorJWTController,
				// TestDecoratorAuthenticateController,
			],
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
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	describe('JwtAuthentication', () => {
		it('should throw with UnauthorizedException if no jwt can be extracted from request context', async () => {
			const response = await request(app.getHttpServer()).get('/test_decorator_JWT/test');

			expect(response.statusCode).toEqual(401);
		});

		it('should succeed if it can get the jwt', async () => {
			const jwt = 'example-jwt';
			const response = await request(app.getHttpServer())
				.get('/test_decorator_JWT/test')
				.set('Authorization', `Bearer ${jwt}`);

			expect(response.statusCode).toEqual(200);
		});
	});

	describe('CurrentUser', () => {
		it('should throw with UnauthorizedException if no jwt user data can be extracted from request context', async () => {
			// @ts-expect-error Testcase
			currentUser = undefined;

			const response = await request(app.getHttpServer()).get('/test_decorator_currentUser/test');

			expect(response.statusCode).toEqual(401);
		});
	});
});

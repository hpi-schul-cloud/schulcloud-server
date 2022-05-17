import { ExecutionContext, ForbiddenException, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { ServerTestModule } from '@src/server.module';
import { ICurrentUser } from '@shared/domain';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { Authenticate } from './auth.decorator';

describe('[Authenticate] Decorator', () => {
	it('should fail when non-jwt strategy is set', () => {
		expect(() => Authenticate('foo' as unknown as 'jwt')).toThrow(ForbiddenException);
	});

	it('should fail when no strategy is set', () => {
		expect(() => Authenticate(undefined as unknown as 'jwt')).toThrow(ForbiddenException);
	});
});

describe('CurrentUser', () => {
	let app: INestApplication;
	let currentUser: ICurrentUser;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
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
	});

	it('should throw with UnauthorizedException if no jwt user data can be extracted from request context', async () => {
		// @ts-expect-error Testcase
		currentUser = undefined;

		const response = await request(app.getHttpServer()).get('/user/me');

		expect(response.statusCode).toEqual(401);
	});
});

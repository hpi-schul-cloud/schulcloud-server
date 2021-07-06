import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserUC, RoleUC } from '../uc';
import { RoleRepo, UserRepo } from '../repo';

describe('UserController', () => {
	let controller: UserController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UserController],
			providers: [UserUC, RoleUC, RoleRepo, UserRepo],
		}).compile();

		controller = module.get<UserController>(UserController);
	});

	it.skip('should be defined', () => {
		expect(controller).toBeDefined();
		expect(typeof controller.me).toEqual('function');
	});
});

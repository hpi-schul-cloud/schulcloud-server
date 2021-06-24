import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserUC } from '../uc';

describe('TaskService', () => {
	let controller: UserController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UserController],
			providers: [UserUC],
		}).compile();

		controller = module.get<UserController>(UserController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});

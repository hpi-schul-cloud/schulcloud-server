import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { setupEntities } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { ClassUC } from './class.uc';
import { ClassService } from '../service';

describe('ClassUC', () => {
	let classUC: ClassUC;
	let module: TestingModule;

	let classService: DeepMocked<ClassService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ClassUC,
				{
					provide: ClassService,
					useValue: createMock<ClassService>(),
				},
			],
		}).compile();
		classUC = module.get(ClassUC);
		classService = module.get(ClassService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(classUC).toBeDefined();
	});

	it('should call classService.deleteUserDataFromClasses', async () => {
		const userId = new ObjectId().toHexString();

		await classUC.deleteUserData(userId);

		expect(classService.deleteUserDataFromClasses).toBeCalledWith(userId);
	});

	it('should update classes without deleted user', async () => {
		const userId = new ObjectId().toHexString();

		classService.deleteUserDataFromClasses.mockResolvedValue(3);

		const result = await classUC.deleteUserData(userId);

		expect(result).toEqual(3);
	});
});

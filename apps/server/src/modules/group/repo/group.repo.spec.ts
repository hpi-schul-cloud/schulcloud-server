import { Test, TestingModule } from '@nestjs/testing';
import { GroupRepo } from './group.repo';

describe('GroupRepo', () => {
	let module: TestingModule;
	let repo: GroupRepo;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [GroupRepo],
		}).compile();

		repo = module.get(GroupRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('findById', () => {
		describe('when xyz', () => {
			const setup = () => {
				return {};
			};

			it('should xyz', () => {
				const {} = setup();
			});
		});
	});

	describe('save', () => {});
	describe('delete', () => {});
});

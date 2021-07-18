import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { GroupRepo } from '../repo';
import { GroupUC } from './group.uc';

describe('GroupUC', () => {
	let service: GroupUC;
	let repo: GroupRepo;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				GroupUC,
				GroupRepo,
				{
					provide: GroupRepo,
					useValue: {
						async getCourseGroupsByUserId() {
							return Promise.resolve([]);
						},
						async getCoursesByUserId() {
							return Promise.resolve([]);
						},
					},
				},
			],
		}).compile();

		service = module.get(GroupUC);
		repo = module.get(GroupRepo);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
		expect(typeof service.getCourseGroupsByUserId).toEqual('function');
	});

	describe('getCourseGroupsByUserId', () => {
		it('should return a promise', () => {
			const userId = new ObjectId().toHexString();
			const result = service.getCourseGroupsByUserId(userId);
			expect(typeof result.then).toEqual('function');
		});

		it.todo('should work for coursegroupGroups');

		it.todo('should work for courseGroups');
	});
});

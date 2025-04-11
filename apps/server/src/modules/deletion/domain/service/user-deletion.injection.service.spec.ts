import { UserDeletionInjectionService } from './user-deletion-injection.service';
import { DeletionService } from '../interface';

describe('UserDeletionInjectionService', () => {
	let service: UserDeletionInjectionService;

	beforeEach(() => {
		service = new UserDeletionInjectionService();
	});

	describe('injectUserDeletionService', () => {
		it('should add a user deletion service to the list', () => {
			const mockDeletionService: DeletionService = { deleteUserData: jest.fn() };

			service.injectUserDeletionService(mockDeletionService);

			expect(service.getUserDeletionServices()).toContain(mockDeletionService);
		});
	});

	describe('getUserDeletionServices', () => {
		it('should return all injected user deletion services', () => {
			const mockDeletionService1: DeletionService = { deleteUserData: jest.fn() };
			const mockDeletionService2: DeletionService = { deleteUserData: jest.fn() };

			service.injectUserDeletionService(mockDeletionService1);
			service.injectUserDeletionService(mockDeletionService2);

			const result = service.getUserDeletionServices();

			expect(result).toHaveLength(2);
			expect(result).toEqual([mockDeletionService1, mockDeletionService2]);
		});

		it('should return an empty array if no services are injected', () => {
			const result = service.getUserDeletionServices();

			expect(result).toEqual([]);
		});
	});
});

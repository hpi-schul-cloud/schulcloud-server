import { Test, TestingModule } from '@nestjs/testing';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../types';
import { CopyHelperService } from './copy-helper.service';

function createStates(elementStates: CopyStatusEnum[]): CopyStatus[] {
	return elementStates.map((status: CopyStatusEnum) => {
		return {
			title: `title-${Math.floor(Math.random() * 1000)}-${status}`,
			type: CopyElementType.LEAF,
			status,
		};
	});
}

describe('copy helper service', () => {
	let module: TestingModule;
	let copyHelperService: CopyHelperService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [CopyHelperService],
		}).compile();

		copyHelperService = module.get(CopyHelperService);
	});

	describe('deriveStatusFromElements', () => {
		describe('successful cases', () => {
			it('should set status to success, if all elements are successful', () => {
				const elements = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.SUCCESS]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should set status to success, if there are both successful and not doing children', () => {
				const elements = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.NOT_DOING]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.SUCCESS);
			});
		});

		describe('failure cases', () => {
			it('should return fail if no elements were given', () => {
				const derivedStatus = copyHelperService.deriveStatusFromElements([]);

				expect(derivedStatus).toEqual(CopyStatusEnum.FAIL);
			});

			it('should set status to fail, if all elements are failing', () => {
				const elements = createStates([CopyStatusEnum.FAIL, CopyStatusEnum.FAIL]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.FAIL);
			});

			it('should set status to fail, when all elements are not implemented', () => {
				const elements = createStates([CopyStatusEnum.NOT_IMPLEMENTED, CopyStatusEnum.NOT_IMPLEMENTED]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.FAIL);
			});

			it('should set status to fail, when all elements are not doing', () => {
				const elements = createStates([CopyStatusEnum.NOT_DOING, CopyStatusEnum.NOT_DOING]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.FAIL);
			});

			it('should set status to fail, when all elements are a mixture of failing states', () => {
				const elements = createStates([CopyStatusEnum.FAIL, CopyStatusEnum.NOT_IMPLEMENTED]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.FAIL);
			});

			it('should set status to fail, when it has Failing and Not donig statuses', () => {
				const elements = createStates([CopyStatusEnum.FAIL, CopyStatusEnum.NOT_DOING]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.FAIL);
			});
		});

		describe('partial cases', () => {
			it('should set status to partial, if there are both successful and not implemented children', () => {
				const elements = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.NOT_IMPLEMENTED]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.PARTIAL);
			});

			it('should set status to partial, if there are both successful and failed', () => {
				const elements = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.FAIL]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.PARTIAL);
			});

			it('should return partial, there are only partial children', () => {
				const elements = createStates([CopyStatusEnum.PARTIAL, CopyStatusEnum.PARTIAL]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.PARTIAL);
			});
			it('should return partial, if it has both successful and partial children', () => {
				const elements = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.PARTIAL]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.PARTIAL);
			});

			it('should return partial, if it has both failing and partial children', () => {
				const elements = createStates([CopyStatusEnum.FAIL, CopyStatusEnum.PARTIAL]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.PARTIAL);
			});

			it('should return partial, if it has both not implemented and partial children', () => {
				const elements = createStates([CopyStatusEnum.NOT_IMPLEMENTED, CopyStatusEnum.PARTIAL]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.PARTIAL);
			});

			it('should return partial, if it has both not doing and partial children', () => {
				const elements = createStates([CopyStatusEnum.NOT_DOING, CopyStatusEnum.PARTIAL]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.PARTIAL);
			});
		});
	});

	describe('deriveCopyName', () => {
		it('should get name of element and extend it by number in brackets', () => {
			const originalName = 'Test';
			const nameCopy = copyHelperService.deriveCopyName(originalName);

			expect(nameCopy).toEqual(`${originalName} (1)`);
		});

		it('should get name of element and increase an existing number in brackets', () => {
			let originalName = 'Test';
			const basename = originalName;
			originalName += ' (12)';

			const nameCopy = copyHelperService.deriveCopyName(originalName);

			expect(nameCopy).toEqual(`${basename} (13)`);
		});

		describe('avoid name collisions with existing names', () => {
			it('should not return an existing name', () => {
				const originalName = 'Test';
				const existingName = 'Test (1)';

				const nameCopy = copyHelperService.deriveCopyName(originalName, [existingName]);
				expect(nameCopy).not.toEqual(existingName);
			});

			it('should return the right name regardless of existing names order', () => {
				const originalName = 'Test';
				const existingNames = ['Test (2)', 'Test (3)', 'Test (1)'];

				const nameCopy = copyHelperService.deriveCopyName(originalName, existingNames);
				expect(nameCopy).toEqual('Test (4)');
			});

			it('should use the first available gap in the list', () => {
				const originalName = 'Test';
				const existingNames = ['Test (1)', 'Test (3)'];

				const nameCopy = copyHelperService.deriveCopyName(originalName, existingNames);
				expect(nameCopy).toEqual('Test (2)');
			});

			it('should work when original has a number and a successor', () => {
				const originalName = 'Test (1)';
				const existingNames = ['Test', 'Test (1)', 'Test (2)'];

				const nameCopy = copyHelperService.deriveCopyName(originalName, existingNames);
				expect(nameCopy).toEqual('Test (3)');
			});

			it('should work with long lists of existing names', () => {
				const originalName = 'Test';
				const existingNames = Array.from(Array(2000).keys()).map((n) => `Test (${n})`);

				const nameCopy = copyHelperService.deriveCopyName(originalName, existingNames);
				expect(nameCopy).toEqual('Test (2000)');
			});
		});
	});
});

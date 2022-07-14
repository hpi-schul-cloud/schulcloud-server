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
	});
});

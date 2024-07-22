import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, setupEntities } from '@shared/testing';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../types/copy.types';
import { CopyHelperService } from './copy-helper.service';

function createStates(elementStates: CopyStatusEnum[]): CopyStatus[] {
	return elementStates.map((status: CopyStatusEnum) => {
		const elementState = {
			title: `title-${Math.floor(Math.random() * 1000)}-${status}`,
			type: CopyElementType.LEAF,
			status,
		};
		return elementState;
	});
}
function createNestedStates(elementStates: CopyStatusEnum[]): CopyStatus {
	const elementState = elementStates.shift();
	const element: CopyStatus = {
		title: `title-${Math.floor(Math.random() * 1000)}-${elementStates.length}`,
		type: CopyElementType.LEAF,
		status: CopyStatusEnum.SUCCESS,
	};

	if (elementState) {
		element.status = elementState;
		element.elements = elementStates.length ? [createNestedStates(elementStates)] : [];
	}

	return element;
}

describe('copy helper service', () => {
	let module: TestingModule;
	let copyHelperService: CopyHelperService;

	beforeAll(async () => {
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [CopyHelperService],
		}).compile();

		copyHelperService = module.get(CopyHelperService);
	});

	describe('deriveStatusFromElements', () => {
		describe('setup cases', () => {
			it('should run method multiple times for nested structure', () => {
				const derivedStatusSpy = jest.spyOn(copyHelperService, 'deriveStatusFromElements');
				const element = createNestedStates([
					CopyStatusEnum.SUCCESS,
					CopyStatusEnum.SUCCESS,
					CopyStatusEnum.SUCCESS,
					CopyStatusEnum.SUCCESS,
				]);

				copyHelperService.deriveStatusFromElements([element]);

				expect(derivedStatusSpy).toHaveBeenCalledTimes(4);
				derivedStatusSpy.mockRestore();
			});
		});

		describe('successful cases', () => {
			it('should return success, if no elements were given', () => {
				const derivedStatus = copyHelperService.deriveStatusFromElements([]);

				expect(derivedStatus).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should return success, if all elements are successful', () => {
				const elements = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.SUCCESS]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should return success, if there are both successful and not doing children', () => {
				const elements = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.NOT_DOING]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should return success, if there are no failure subelements', () => {
				const elements = createStates([CopyStatusEnum.NOT_DOING, CopyStatusEnum.NOT_DOING]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.SUCCESS);
			});
		});

		describe('failure cases', () => {
			it('should return fail, if all elements are failing', () => {
				const elements = createStates([CopyStatusEnum.FAIL, CopyStatusEnum.FAIL]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.FAIL);
			});

			it('should return fail, when all elements are not implemented', () => {
				const elements = createStates([CopyStatusEnum.NOT_IMPLEMENTED, CopyStatusEnum.NOT_IMPLEMENTED]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.FAIL);
			});

			it('should return fail, when it has failing and not implemented statuses', () => {
				const elements = createStates([CopyStatusEnum.FAIL, CopyStatusEnum.NOT_IMPLEMENTED]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.FAIL);
			});

			it('should return fail, when it has failing and not doing statuses', () => {
				const elements = createStates([CopyStatusEnum.FAIL, CopyStatusEnum.NOT_DOING]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.FAIL);
			});

			it('should return fail if the last and only nested child is FAIL ', () => {
				const element = createNestedStates([
					CopyStatusEnum.SUCCESS,
					CopyStatusEnum.SUCCESS,
					CopyStatusEnum.SUCCESS,
					CopyStatusEnum.FAIL,
				]);
				const derivedStatus = copyHelperService.deriveStatusFromElements([element]);

				expect(derivedStatus).toEqual(CopyStatusEnum.FAIL);
			});
		});

		describe('partial cases', () => {
			it('should return partial, if there are both successful and not implemented children', () => {
				const elements = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.NOT_IMPLEMENTED]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.PARTIAL);
			});

			it('should return partial, if there are both successful and failed children', () => {
				const elements = createStates([CopyStatusEnum.SUCCESS, CopyStatusEnum.FAIL]);
				const derivedStatus = copyHelperService.deriveStatusFromElements(elements);

				expect(derivedStatus).toEqual(CopyStatusEnum.PARTIAL);
			});

			it('should return partial, if there are only partial children', () => {
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
		describe('when name already exists', () => {
			it('should get name of element and extend it by number in brackets', () => {
				const originalName = 'Test';
				const nameCopy = copyHelperService.deriveCopyName(originalName, [originalName]);

				expect(nameCopy).toEqual(`${originalName} (1)`);
			});

			it('should get name of element and increase an existing number in brackets', () => {
				let originalName = 'Test';
				const basename = originalName;
				originalName += ' (12)';

				const nameCopy = copyHelperService.deriveCopyName(originalName, [originalName]);

				expect(nameCopy).toEqual(`${basename} (13)`);
			});
		});

		describe("when name doesn't exist", () => {
			it('should get name of element and return it', () => {
				const originalName = 'Test';
				const nameCopy = copyHelperService.deriveCopyName(originalName);

				expect(nameCopy).toEqual(`${originalName}`);
			});
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
				const existingNames = ['Test', 'Test (2)', 'Test (3)', 'Test (1)'];

				const nameCopy = copyHelperService.deriveCopyName(originalName, existingNames);
				expect(nameCopy).toEqual('Test (4)');
			});

			it('should use the first available gap in the list', () => {
				const originalName = 'Test';
				const existingNames = ['Test', 'Test (1)', 'Test (3)'];

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

				const nameCopy = copyHelperService.deriveCopyName(originalName, [originalName, ...existingNames]);
				expect(nameCopy).toEqual('Test (2000)');
			});
		});
	});

	describe('buildCopyEntityDict', () => {
		it('should map original to copy', () => {
			const originalEntity = courseFactory.buildWithId();
			const copyEntity = courseFactory.buildWithId();
			const status = {
				type: CopyElementType.COURSE,
				status: CopyStatusEnum.SUCCESS,
				originalEntity,
				copyEntity,
			};
			const copyMap = copyHelperService.buildCopyEntityDict(status);
			expect(copyMap.get(originalEntity.id)).toEqual(copyEntity);
		});

		it('should map entities deeper in structure', () => {
			const originalEntity = courseFactory.buildWithId();
			const copyEntity = courseFactory.buildWithId();
			const status: CopyStatus = {
				type: CopyElementType.COURSE,
				status: CopyStatusEnum.SUCCESS,
				elements: [
					{
						type: CopyElementType.COURSE,
						status: CopyStatusEnum.SUCCESS,
						originalEntity,
						copyEntity,
					},
				],
			};
			const copyMap = copyHelperService.buildCopyEntityDict(status);
			expect(copyMap.get(originalEntity.id)).toEqual(copyEntity);
		});

		it('should work with sub maps', () => {
			const originalEntity = courseFactory.buildWithId();
			const copyEntity = courseFactory.buildWithId();
			const originalChildEntity = courseFactory.buildWithId();
			const copyChildEntity = courseFactory.buildWithId();
			const status = {
				type: CopyElementType.COURSE,
				status: CopyStatusEnum.SUCCESS,
				originalEntity,
				copyEntity,
				elements: [
					{
						type: CopyElementType.FILE_GROUP,
						status: CopyStatusEnum.SUCCESS,
					},
					{
						type: CopyElementType.COURSE,
						status: CopyStatusEnum.SUCCESS,
						originalEntity: originalChildEntity,
						copyEntity: copyChildEntity,
					},
				],
			};
			const copyMap = copyHelperService.buildCopyEntityDict(status);
			expect(copyMap.get(originalEntity.id)).toEqual(copyEntity);
			expect(copyMap.get(originalChildEntity.id)).toEqual(copyChildEntity);
		});
	});
});

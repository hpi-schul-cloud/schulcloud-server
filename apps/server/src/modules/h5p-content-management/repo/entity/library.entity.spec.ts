import { ILibraryMetadata } from '@lumieducation/h5p-server';
import { FileMetadata, InstalledLibrary, LibraryName, Path } from './library.entity';

describe('InstalledLibrary', () => {
	let addonLibVersionOne: InstalledLibrary;
	let addonLibVersionOneMinorChange: InstalledLibrary;
	let addonLibVersionOnePatchChange: InstalledLibrary;
	let addonLibVersionTwo: InstalledLibrary;

	beforeAll(() => {
		const testingLibMetadataVersionOne: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 3,
			machineName: 'testing',
			majorVersion: 1,
			minorVersion: 2,
		};
		const testingLibVersionOne = new InstalledLibrary(testingLibMetadataVersionOne);
		testingLibVersionOne.files.push(
			new FileMetadata('file1', new Date(), 2),
			new FileMetadata('file2', new Date(), 4),
			new FileMetadata('file3', new Date(), 6)
		);

		const addonLibMetadataVersionOne: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 3,
			machineName: 'addonVersionOne',
			majorVersion: 1,
			minorVersion: 2,
		};
		addonLibVersionOne = new InstalledLibrary(addonLibMetadataVersionOne);
		addonLibVersionOne.addTo = { player: { machineNames: [testingLibVersionOne.machineName] } };

		const testingLibMetadataVersionOneMinorChange: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 3,
			machineName: 'testing',
			majorVersion: 1,
			minorVersion: 5,
		};
		const testingLibVersionOneMinorChange = new InstalledLibrary(testingLibMetadataVersionOneMinorChange);
		testingLibVersionOne.files.push(
			new FileMetadata('file1', new Date(), 2),
			new FileMetadata('file2', new Date(), 4),
			new FileMetadata('file3', new Date(), 6)
		);

		const addonLibMetadataVersionOneMinorChange: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 3,
			machineName: 'addonVersionOne',
			majorVersion: 1,
			minorVersion: 5,
		};
		addonLibVersionOneMinorChange = new InstalledLibrary(addonLibMetadataVersionOneMinorChange);
		addonLibVersionOneMinorChange.addTo = { player: { machineNames: [testingLibVersionOneMinorChange.machineName] } };

		const testingLibMetadataVersionOnePatchChange: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 5,
			machineName: 'testing',
			majorVersion: 1,
			minorVersion: 2,
		};
		const testingLibVersionOnePatchChange = new InstalledLibrary(testingLibMetadataVersionOnePatchChange);
		testingLibVersionOne.files.push(
			new FileMetadata('file1', new Date(), 2),
			new FileMetadata('file2', new Date(), 4),
			new FileMetadata('file3', new Date(), 6)
		);

		const addonLibMetadataVersionOnePatchChange: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 5,
			machineName: 'addonVersionOne',
			majorVersion: 1,
			minorVersion: 2,
		};
		addonLibVersionOnePatchChange = new InstalledLibrary(addonLibMetadataVersionOnePatchChange);
		addonLibVersionOnePatchChange.addTo = { player: { machineNames: [testingLibVersionOnePatchChange.machineName] } };

		const testingLibMetadataVersionTwo: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 4,
			machineName: 'addonVersionTwo',
			majorVersion: 2,
			minorVersion: 3,
		};
		const testingLibVersionTwo = new InstalledLibrary(testingLibMetadataVersionTwo);
		testingLibVersionTwo.files.push(
			new FileMetadata('file1', new Date(), 2),
			new FileMetadata('file2', new Date(), 4),
			new FileMetadata('file3', new Date(), 6)
		);

		const addonLibMetadataVersionTwo: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 4,
			machineName: 'addonVersionTwo',
			majorVersion: 2,
			minorVersion: 3,
		};
		addonLibVersionTwo = new InstalledLibrary(addonLibMetadataVersionTwo);
		addonLibVersionTwo.addTo = { player: { machineNames: [testingLibVersionTwo.machineName] } };
	});

	describe('simple_compare', () => {
		it('should return 1 if a is greater than b', () => {
			expect(InstalledLibrary.simple_compare(5, 3)).toBe(1);
		});

		it('should return -1 if a is less than b', () => {
			expect(InstalledLibrary.simple_compare(3, 5)).toBe(-1);
		});

		it('should return 0 if a is equal to b', () => {
			expect(InstalledLibrary.simple_compare(3, 3)).toBe(0);
		});
	});

	describe('compare', () => {
		describe('when compare', () => {});
		it('should return -1', () => {
			const result = addonLibVersionOne.compare(addonLibVersionTwo);
			expect(result).toBe(-1);
		});
		describe('when compare library Version', () => {
			it('should call compareVersions', () => {
				const compareVersionsSpy = (
					jest.spyOn(addonLibVersionOne, 'compareVersions') as jest.SpyInstance<any, any>
				).mockReturnValueOnce(0);
				addonLibVersionOne.compare(addonLibVersionOne);
				expect(compareVersionsSpy).toHaveBeenCalled();
				compareVersionsSpy.mockRestore();
			});
		});
	});

	describe('compareVersions', () => {
		describe('when calling compareVersions with Major Change', () => {
			it('should return -1 and call simple_compare once', () => {
				const simpleCompareSpy = jest.spyOn(InstalledLibrary, 'simple_compare');
				const result = addonLibVersionOne.compareVersions(addonLibVersionTwo);
				expect(result).toBe(-1);
				expect(simpleCompareSpy).toHaveBeenCalledTimes(1);
			});
		});

		describe('when calling compareVersions with Minor Change', () => {
			it('should return -1 and call simple_compare three times', () => {
				const simpleCompareSpy = jest.spyOn(InstalledLibrary, 'simple_compare');
				const result = addonLibVersionOne.compareVersions(addonLibVersionOneMinorChange);
				expect(result).toBe(-1);
				expect(simpleCompareSpy).toHaveBeenCalledTimes(3);
			});
		});

		describe('when calling compareVersions with same Major & Minor Versions', () => {
			it('should return call simple_compare with patch versions', () => {
				const simpleCompareSpy = jest.spyOn(InstalledLibrary, 'simple_compare');
				const result = addonLibVersionOne.compareVersions(addonLibVersionOnePatchChange);
				expect(result).toBe(-1);
				expect(simpleCompareSpy).toHaveBeenCalledWith(
					addonLibVersionOne.patchVersion,
					addonLibVersionOnePatchChange.patchVersion
				);
			});
		});
	});
});

describe('LibraryName', () => {
	let libraryName: LibraryName;

	beforeEach(() => {
		libraryName = new LibraryName('test', 1, 2);
	});

	it('should be defined', () => {
		expect(libraryName).toBeDefined();
	});

	it('should create libraryName', () => {
		const newlibraryName = new LibraryName('newtest', 1, 2);
		expect(newlibraryName.machineName).toEqual('newtest');
	});

	it('should change libraryName', () => {
		libraryName.machineName = 'changed-name';
		expect(libraryName.machineName).toEqual('changed-name');
	});
});

describe('Path', () => {
	let path: Path;

	beforeEach(() => {
		path = new Path('');
	});

	it('should be defined', () => {
		expect(path).toBeDefined();
	});

	it('should create path', () => {
		const newPath = new Path('test-path');
		expect(newPath.path).toEqual('test-path');
	});

	it('should change path', () => {
		path.path = 'new-path';
		expect(path.path).toEqual('new-path');
	});
});

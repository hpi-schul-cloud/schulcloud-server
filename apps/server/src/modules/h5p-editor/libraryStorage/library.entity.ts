import { Entity, Property } from '@mikro-orm/core';
import { IInstalledLibrary, ILibraryName } from '@lumieducation/h5p-server';
import { BaseEntity } from '@shared/domain';
import { IFileStats, IPath } from '@lumieducation/h5p-server/build/src/types';

export class Path implements IPath {
	@Property()
	path: string;

	constructor(path: string) {
		this.path = path;
	}
}

export class LibraryName implements ILibraryName {
	@Property()
	machineName: string;

	@Property()
	majorVersion: number;

	@Property()
	minorVersion: number;

	constructor(machineName: string, majorVersion: number, minorVersion: number) {
		this.machineName = machineName;
		this.majorVersion = majorVersion;
		this.minorVersion = minorVersion;
	}
}

export class FileMetadata implements IFileStats {
	name: string;

	birthtime: Date;

	size: number;

	constructor(name: string, birthtime: Date, size: number) {
		this.name = name;
		this.birthtime = birthtime;
		this.size = size;
	}
}

@Entity({ tableName: 'h5p_library' })
export class InstalledLibrary extends BaseEntity implements IInstalledLibrary {
	@Property()
	machineName: string;

	@Property()
	majorVersion: number;

	@Property()
	minorVersion: number;

	@Property()
	patchVersion: number;

	/**
	 * Addons can be added to other content types by
	 */
	@Property()
	addTo?: {
		content?: {
			types?: {
				text?: {
					/**
					 * If any string property in the parameters matches the regex,
					 * the addon will be activated for the content.
					 */
					regex?: string;
				};
			}[];
		};
		/**
		 * Contains cases in which the library should be added to the editor.
		 *
		 * This is an extension to the H5P library metadata structure made by
		 * h5p-nodejs-library. That way addons can specify to which editors
		 * they should be added in general. The PHP implementation hard-codes
		 * this list into the server, which we want to avoid here.
		 */
		editor?: {
			/**
			 * A list of machine names in which the addon should be added.
			 */
			machineNames: string[];
		};
		/**
		 * Contains cases in which the library should be added to the player.
		 *
		 * This is an extension to the H5P library metadata structure made by
		 * h5p-nodejs-library. That way addons can specify to which editors
		 * they should be added in general. The PHP implementation hard-codes
		 * this list into the server, which we want to avoid here.
		 */
		player?: {
			/**
			 * A list of machine names in which the addon should be added.
			 */
			machineNames: string[];
		};
	};

	/**
	 * If set to true, the library can only be used be users who have this special
	 * privilege.
	 */
	@Property()
	restricted: boolean;

	@Property()
	author?: string;

	/**
	 * The core API required to run the library.
	 */
	@Property()
	coreApi?: {
		majorVersion: number;
		minorVersion: number;
	};

	@Property()
	description?: string;

	@Property()
	dropLibraryCss?: {
		machineName: string;
	}[];

	@Property()
	dynamicDependencies?: LibraryName[];

	@Property()
	editorDependencies?: LibraryName[];

	@Property()
	embedTypes?: ('iframe' | 'div')[];

	@Property()
	fullscreen?: 0 | 1;

	@Property()
	h?: number;

	@Property()
	license?: string;

	@Property()
	metadataSettings?: {
		disable: 0 | 1;
		disableExtraTitleField: 0 | 1;
	};

	@Property()
	preloadedCss?: Path[];

	@Property()
	preloadedDependencies?: LibraryName[];

	@Property()
	preloadedJs?: Path[];

	@Property()
	runnable: boolean | 0 | 1;

	@Property()
	title: string;

	@Property()
	w?: number;

	@Property()
	requiredExtensions?: {
		sharedState: number;
	};

	@Property()
	state?: {
		snapshotSchema: boolean;
		opSchema: boolean;
		snapshotLogicChecks: boolean;
		opLogicChecks: boolean;
	};

	@Property()
	files: FileMetadata[];

	private simple_compare(a: number, b: number): number {
		if (a > b) {
			return 1;
		}
		if (a < b) {
			return -1;
		}
		return 0;
	}

	public compare(otherLibrary: IInstalledLibrary): number {
		if (this.machineName === otherLibrary.machineName) {
			return this.compareVersions(otherLibrary);
		}
		return this.machineName > otherLibrary.machineName ? 1 : -1;
	}

	compareVersions(otherLibrary: ILibraryName & { patchVersion?: number }): number {
		let result = this.simple_compare(this.majorVersion, otherLibrary.majorVersion);
		if (result !== 0) {
			return result;
		}
		result = this.simple_compare(this.minorVersion, otherLibrary.minorVersion);
		if (result !== 0) {
			return result;
		}
		if (this.patchVersion === undefined) {
			if (otherLibrary.patchVersion === undefined) {
				return 0;
			}
			return -1;
		}
		if (otherLibrary.patchVersion === undefined) {
			return 1;
		}
		return this.simple_compare(this.patchVersion, otherLibrary.patchVersion);
	}

	constructor(
		machineName: string,
		majorVersion: number,
		minorVersion: number,
		patchVersion: number,
		restricted = false,
		runnable: boolean | 0 | 1 = false,
		title = '',
		files: FileMetadata[] = [],
		addTo?: {
			content?: { types?: { text?: { regex?: string } }[] };
			editor?: { machineNames: string[]; player?: { machineNames: string[] } };
		},
		author?: string,
		coreApi?: { majorVersion: number; minorVersion: number },
		description?: string,
		dropLibraryCss?: { machineName: string }[],
		dynamicDependencies?: LibraryName[],
		editorDependencies?: LibraryName[],
		embedTypes?: ('iframe' | 'div')[],
		fullscreen?: 0 | 1,
		h?: number,
		license?: string,
		metadataSettings?: { disable: 0 | 1; disableExtraTitleField: 0 | 1 },
		preloadedCss?: Path[],
		preloadedDependencies?: LibraryName[],
		preloadedJs?: Path[],
		w?: number,
		requiredExtensions?: { sharedState: number },
		state?: { snapshotSchema: boolean; opSchema: boolean; snapshotLogicChecks: boolean; opLogicChecks: boolean }
	) {
		super();
		this.machineName = machineName;
		this.majorVersion = majorVersion;
		this.minorVersion = minorVersion;
		this.patchVersion = patchVersion;
		this.restricted = restricted;
		this.runnable = runnable;
		this.title = title;
		this.files = files;
		this.addTo = addTo;
		this.author = author;
		this.coreApi = coreApi;
		this.description = description;
		this.dropLibraryCss = dropLibraryCss;
		this.dynamicDependencies = dynamicDependencies;
		this.editorDependencies = editorDependencies;
		this.embedTypes = embedTypes;
		this.fullscreen = fullscreen;
		this.h = h;
		this.license = license;
		this.metadataSettings = metadataSettings;
		this.preloadedCss = preloadedCss;
		this.preloadedDependencies = preloadedDependencies;
		this.preloadedJs = preloadedJs;
		this.w = w;
		this.requiredExtensions = requiredExtensions;
		this.state = state;
	}
}

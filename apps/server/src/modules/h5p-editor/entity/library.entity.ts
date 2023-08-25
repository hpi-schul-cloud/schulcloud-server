import { IInstalledLibrary, ILibraryName } from '@lumieducation/h5p-server';
import { IFileStats, ILibraryMetadata, IPath } from '@lumieducation/h5p-server/build/src/types';
import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '@shared/domain';

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
	@Property({ nullable: true })
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

	@Property({ nullable: true })
	author?: string;

	/**
	 * The core API required to run the library.
	 */
	@Property({ nullable: true })
	coreApi?: {
		majorVersion: number;
		minorVersion: number;
	};

	@Property({ nullable: true })
	description?: string;

	@Property({ nullable: true })
	dropLibraryCss?: {
		machineName: string;
	}[];

	@Property({ nullable: true })
	dynamicDependencies?: LibraryName[];

	@Property({ nullable: true })
	editorDependencies?: LibraryName[];

	@Property({ nullable: true })
	embedTypes?: ('iframe' | 'div')[];

	@Property({ nullable: true })
	fullscreen?: 0 | 1;

	@Property({ nullable: true })
	h?: number;

	@Property({ nullable: true })
	license?: string;

	@Property({ nullable: true })
	metadataSettings?: {
		disable: 0 | 1;
		disableExtraTitleField: 0 | 1;
	};

	@Property({ nullable: true })
	preloadedCss?: Path[];

	@Property({ nullable: true })
	preloadedDependencies?: LibraryName[];

	@Property({ nullable: true })
	preloadedJs?: Path[];

	@Property()
	runnable: boolean | 0 | 1;

	@Property()
	title: string;

	@Property({ nullable: true })
	w?: number;

	@Property({ nullable: true })
	requiredExtensions?: {
		sharedState: number;
	};

	@Property({ nullable: true })
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

	constructor(libraryMetadata: ILibraryMetadata, restricted = false, files: FileMetadata[] = []) {
		super();
		this.machineName = libraryMetadata.machineName;
		this.majorVersion = libraryMetadata.majorVersion;
		this.minorVersion = libraryMetadata.minorVersion;
		this.patchVersion = libraryMetadata.patchVersion;
		this.runnable = libraryMetadata.runnable;
		this.title = libraryMetadata.title;
		this.addTo = libraryMetadata.addTo;
		this.author = libraryMetadata.author;
		this.coreApi = libraryMetadata.coreApi;
		this.description = libraryMetadata.description;
		this.dropLibraryCss = libraryMetadata.dropLibraryCss;
		this.dynamicDependencies = libraryMetadata.dynamicDependencies;
		this.editorDependencies = libraryMetadata.editorDependencies;
		this.embedTypes = libraryMetadata.embedTypes;
		this.fullscreen = libraryMetadata.fullscreen;
		this.h = libraryMetadata.h;
		this.license = libraryMetadata.license;
		this.metadataSettings = libraryMetadata.metadataSettings;
		this.preloadedCss = libraryMetadata.preloadedCss;
		this.preloadedDependencies = libraryMetadata.preloadedDependencies;
		this.preloadedJs = libraryMetadata.preloadedJs;
		this.w = libraryMetadata.w;
		this.requiredExtensions = libraryMetadata.requiredExtensions;
		this.state = libraryMetadata.state;
		this.restricted = restricted;
		this.files = files;
	}
}

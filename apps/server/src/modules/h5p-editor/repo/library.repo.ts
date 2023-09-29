import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { InstalledLibrary } from '../entity';

@Injectable()
export class LibraryRepo extends BaseRepo<InstalledLibrary> {
	get entityName() {
		return InstalledLibrary;
	}

	async createLibrary(library: InstalledLibrary): Promise<void> {
		const entity = this.create(library);
		await this.save(entity);
	}

	async getAll(): Promise<InstalledLibrary[]> {
		return this._em.find(this.entityName, {});
	}

	async findOneByNameAndVersionOrFail(
		machineName: string,
		majorVersion: number,
		minorVersion: number
	): Promise<InstalledLibrary> {
		const libs = await this._em.find(this.entityName, { machineName, majorVersion, minorVersion });
		if (libs.length === 1) {
			return libs[0];
		}
		if (libs.length === 0) {
			throw new Error('Library not found');
		}
		throw new Error('Multiple libraries with the same name and version found');
	}

	async findByName(machineName: string): Promise<InstalledLibrary[]> {
		return this._em.find(this.entityName, { machineName });
	}

	async findNewestByNameAndVersion(
		machineName: string,
		majorVersion: number,
		minorVersion: number
	): Promise<InstalledLibrary | null> {
		const libs = await this._em.find(this.entityName, {
			machineName,
			majorVersion,
			minorVersion,
		});
		let latest: InstalledLibrary | null = null;
		for (const lib of libs) {
			if (latest === null || lib.patchVersion > latest.patchVersion) {
				latest = lib;
			}
		}
		return latest;
	}

	async findByNameAndExactVersion(
		machineName: string,
		majorVersion: number,
		minorVersion: number,
		patchVersion: number
	): Promise<InstalledLibrary | null> {
		const [libs, count] = await this._em.findAndCount(this.entityName, {
			machineName,
			majorVersion,
			minorVersion,
			patchVersion,
		});
		if (count > 1) {
			throw new Error('too many libraries with same name and version');
		}
		if (count === 1) {
			return libs[0];
		}
		return null;
	}
}

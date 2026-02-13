import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { InstalledLibrary } from './entity';
import { EntityName } from '@mikro-orm/core';

@Injectable()
export class LibraryRepo extends BaseRepo<InstalledLibrary> {
	get entityName(): EntityName<InstalledLibrary> {
		return InstalledLibrary;
	}

	public async createLibrary(library: InstalledLibrary): Promise<void> {
		const entity = this.create(library);

		await this.save(entity);
	}

	/**
	 * This is a operation that need high memory consumption.
	 */
	public async getAll(): Promise<InstalledLibrary[]> {
		const libraries = await this._em.find(this.entityName, {});

		return libraries;
	}

	public async findOneByNameAndVersionOrFail(
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

	public async findByName(machineName: string): Promise<InstalledLibrary[]> {
		const libraries = await this._em.find(this.entityName, { machineName });

		return libraries;
	}

	public async findNewestByNameAndVersion(
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

	public async findByNameAndExactVersion(
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

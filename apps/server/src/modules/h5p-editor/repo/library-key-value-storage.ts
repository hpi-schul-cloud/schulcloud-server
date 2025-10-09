import { IKeyValueStorage } from '@lumieducation/h5p-server/build/src/types';
import { EntityManager } from '@mikro-orm/mongodb';
import { InstalledLibrary } from './entity/library.entity';

export class LibraryKeyValueStorage implements IKeyValueStorage {
	constructor(private readonly em: EntityManager) {}

	public async load(key: string): Promise<any> {
		const result = await this.em.findOne(InstalledLibrary, { machineName: key });
		return result;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async save(key: string, value: any): Promise<void> {
		// No operation (noop)
		return;
	}
}

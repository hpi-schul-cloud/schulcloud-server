import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TldrawDrawing } from '../entities';

@Injectable()
export class TldrawRepo {
	constructor(private readonly _em: EntityManager) {}

	async create(entity: TldrawDrawing): Promise<void> {
		await this._em.persistAndFlush(entity);
	}

	async findByDocName(docName: string): Promise<TldrawDrawing[]> {
		const domainObject = await this._em.find(TldrawDrawing, { docName });
		if (domainObject.length === 0) {
			throw new NotFoundException(`There is no '${docName}' for this docName`);
		}
		return domainObject;
	}

	async delete(entity: TldrawDrawing | TldrawDrawing[]): Promise<void> {
		await this._em.removeAndFlush(entity);
	}
}

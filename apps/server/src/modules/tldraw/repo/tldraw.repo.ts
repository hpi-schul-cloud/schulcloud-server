import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { TldrawDrawing } from '@src/modules/tldraw/entities';

@Injectable()
export class TldrawRepo {
	constructor(private readonly _em: EntityManager) {}

	async create(entity: TldrawDrawing): Promise<void> {
		await this._em.persistAndFlush(entity);
	}

	async findByDrawingName(drawingName: string): Promise<TldrawDrawing[]> {
		return this._em.find(TldrawDrawing, { docName: drawingName });
	}

	async delete(entity: TldrawDrawing | TldrawDrawing[]): Promise<void> {
		await this._em.removeAndFlush(entity);
	}
}

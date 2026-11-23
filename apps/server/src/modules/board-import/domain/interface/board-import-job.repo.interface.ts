import { type EntityId } from '@shared/domain/types';
import { type BoardImportJob } from '../do';

export interface BoardImportJobRepo {
	save(job: BoardImportJob): Promise<BoardImportJob>;

	findById(id: EntityId): Promise<BoardImportJob | null>;
}

export const BOARD_IMPORT_JOB_REPO = 'BOARD_IMPORT_JOB_REPO';

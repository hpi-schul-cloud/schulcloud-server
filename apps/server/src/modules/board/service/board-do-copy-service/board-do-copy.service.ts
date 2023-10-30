import { Injectable } from '@nestjs/common';
import { AnyBoardDo } from '@shared/domain/domainobject/board/types/any-board-do';
import { CopyStatus } from '@src/modules/copy-helper/types/copy.types';
import { RecursiveCopyVisitor } from './recursive-copy.visitor';
import { SchoolSpecificFileCopyService } from './school-specific-file-copy.interface';

export type BoardDoCopyParams = {
	original: AnyBoardDo;
	fileCopyService: SchoolSpecificFileCopyService;
};

@Injectable()
export class BoardDoCopyService {
	public async copy(params: BoardDoCopyParams): Promise<CopyStatus> {
		const visitor = new RecursiveCopyVisitor(params.fileCopyService);

		const result = await visitor.copy(params.original);

		return result;
	}
}

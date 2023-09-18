import { Injectable } from '@nestjs/common';
import { AnyBoardDo, EntityId } from '@shared/domain';
import { CopyStatus } from '@src/modules/copy-helper';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { RecursiveCopyVisitor } from './recursive-copy.visitor';

export type BoardDoCopyParams = {
	originSchoolId: EntityId;
	targetSchoolId?: EntityId;
	userId: EntityId;
	original: AnyBoardDo;
};

@Injectable()
export class BoardDoCopyService {
	constructor(private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService) {}

	public async copy(params: BoardDoCopyParams): Promise<CopyStatus> {
		const visitor = new RecursiveCopyVisitor(this.filesStorageClientAdapterService, {
			userId: params.userId,
			originSchoolId: params.originSchoolId,
			targetSchoolId: params.targetSchoolId || params.originSchoolId,
		});

		const result = await visitor.copy(params.original);

		return result;
	}
}

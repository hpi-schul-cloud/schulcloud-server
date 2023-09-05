import { Injectable, NotImplementedException } from '@nestjs/common';
import { BoardExternalReference, EntityId } from '@shared/domain';
import { CopyStatus } from '@src/modules/copy-helper';

@Injectable()
export class ColumnBoardCopyService {
	copyColumnBoard(props: {
		originalColumnBoardId: EntityId;
		destinationExternalReference: BoardExternalReference;
		userId: EntityId;
	}): Promise<CopyStatus> {
		// load original DO
		// instanciate copy visitor
		// run copy visitor
		// fetch copy result from visitor
		// persist copy
		// return

		throw new NotImplementedException(props);
	}
}

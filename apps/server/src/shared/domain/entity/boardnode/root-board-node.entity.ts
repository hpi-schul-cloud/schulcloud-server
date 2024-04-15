import { BoardExternalReference } from '@shared/domain/domainobject/board/types';
import { BoardNodeProps } from './boardnode.entity';

// TODO Use an abstract base class for root nodes that have a contextId and a contextType. Multiple STI abstract base classes are blocked by MikroORM 6.1.2 (issue #3745)
// export abstract class RootBoardNode extends BoardNode { ... }

export interface RootBoardNodeProps extends BoardNodeProps {
	context: BoardExternalReference;
}

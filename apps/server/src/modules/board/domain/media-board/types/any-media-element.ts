import type { DeletedElement } from '../../deleted-element.do';
import type { MediaExternalToolElement } from '../media-external-tool-element.do';

export type AnyMediaElement = MediaExternalToolElement | DeletedElement;

// NOTE: isAnyMediaElement guard has been moved to ../guards/media-board.guards.ts
// to break circular dependencies. Import it from there or from domain/index.ts

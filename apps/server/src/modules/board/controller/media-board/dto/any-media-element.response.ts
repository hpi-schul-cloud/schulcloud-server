import { AnyBoardNode, AnyMediaElement, isDeletedElement, isMediaExternalToolElement } from '../../../domain';
import { DeletedElementResponse } from '../../dto';
import { MediaExternalToolElementResponse } from './media-external-tool-element.response';

export type AnyMediaElementResponse = MediaExternalToolElementResponse | DeletedElementResponse;

import { type DeletedElementResponse } from '../../dto';
import { type MediaExternalToolElementResponse } from './media-external-tool-element.response';

export type AnyMediaElementResponse = MediaExternalToolElementResponse | DeletedElementResponse;

import { FileElementResponse } from './file-element.response';
import { TextElementResponse } from './text-element.response';

export type AnyContentElementResponse = TextElementResponse | FileElementResponse /* | HyperlinkElementResponse */;

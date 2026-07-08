import { FileFolderElement } from '../file-folder-element.do';
import { type FileFolderElementProps } from '../types';

export class FileFolderElementFactory {
	public static build(props: FileFolderElementProps): FileFolderElement {
		return new FileFolderElement(props);
	}
}

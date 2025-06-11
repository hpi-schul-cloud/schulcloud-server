import { FileFolderElement } from '../file-folder-element.do';
import { FileFolderElementProps } from '../types';

export class FileFolderElementFactory {
	public static build(props: FileFolderElementProps): FileFolderElement {
		return new FileFolderElement(props);
	}
}

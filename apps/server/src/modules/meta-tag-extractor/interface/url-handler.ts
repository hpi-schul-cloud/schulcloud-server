import { MetaData } from '../types';

export interface UrlHandler {
	doesUrlMatch(url: URL): boolean;
	getMetaData(url: URL): Promise<MetaData | undefined>;
}

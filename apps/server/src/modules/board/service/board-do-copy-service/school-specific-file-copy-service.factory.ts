import { Embeddable } from '@mikro-orm/core';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import {
	SchoolSpecificFileCopyService,
	SchoolSpecificFileCopyServiceProps,
} from './school-specific-file-copy.interface';
import { SchoolSpecificFileCopyServiceImpl } from './school-specific-file-copy.service';

@Embeddable()
export class SchoolSpecificFileCopyServiceFactory {
	constructor(private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService) {}

	build(props: SchoolSpecificFileCopyServiceProps): SchoolSpecificFileCopyService {
		return new SchoolSpecificFileCopyServiceImpl(this.filesStorageClientAdapterService, props);
	}
}

import { Injectable } from '@nestjs/common';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import {
	SchoolSpecificFileCopyService,
	SchoolSpecificFileCopyServiceProps,
} from './school-specific-file-copy.interface';
import { SchoolSpecificFileCopyServiceImpl } from './school-specific-file-copy.service';

@Injectable()
export class SchoolSpecificFileCopyServiceFactory {
	constructor(private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService) {}

	build(props: SchoolSpecificFileCopyServiceProps): SchoolSpecificFileCopyService {
		return new SchoolSpecificFileCopyServiceImpl(this.filesStorageClientAdapterService, props);
	}
}

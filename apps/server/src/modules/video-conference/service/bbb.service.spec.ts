import { Test, TestingModule } from '@nestjs/testing';
import { CollaborativeStorageService } from '@src/modules/collaborative-storage/services/collaborative-storage.service';
import { BBBService } from '@src/modules/video-conference/service/bbb.service';
import { HttpService } from '@nestjs/axios';

describe('BBB Service', () => {
	let module: TestingModule;
	let service: BBBService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [BBBService, HttpService],
		}).compile();
	});

	describe('create', () => {});
});

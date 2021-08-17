import { Test, TestingModule } from '@nestjs/testing';
import { JwtValidationService } from './jwt-validation.service';

describe('JwtValidationService', () => {
  let service: JwtValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtValidationService],
    }).compile();

    service = module.get<JwtValidationService>(JwtValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

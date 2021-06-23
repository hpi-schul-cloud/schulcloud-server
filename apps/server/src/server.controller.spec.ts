import { Test, TestingModule } from '@nestjs/testing';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';

describe('ServerController', () => {
  let serverController: ServerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ServerController],
      providers: [ServerService],
    }).compile();

    serverController = app.get<ServerController>(ServerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(serverController.getHello()).toBe('Hello World!');
    });
  });
});

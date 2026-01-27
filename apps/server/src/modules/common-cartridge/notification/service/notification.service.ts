import { Injectable } from '@nestjs/common';
import { NotificationRepo } from '../repo/notification.repo';
import { NotificationDto } from '../dto/notification.dto';
import { Logger } from '@core/logger';
import { Loggable, LoggableMessage } from '@shared/common/loggable/interfaces';
import { NotificationLoggable } from './notification-loggable';
import { NotificationType } from '../dto/notification-type.enum';
import { EntityManager } from '@mikro-orm/mongodb';
import { NotificationEntity } from '../entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(private readonly logger: Logger, private readonly notificationRepo: NotificationRepo) {
    logger.setContext(NotificationService.name);
  }
  
  public async create(notificationDto: NotificationDto): Promise<NotificationEntity> {
    const entity = NotificationRepo.mapDtoToEntity(notificationDto);
    await this.notificationRepo.createAndSaveNotification(entity);
    if (entity.notificationType = NotificationType.ERROR) {
      this.logger.warning(new NotificationLoggable("An error occurred during the import process"));
    } else {
      this.logger.info(new NotificationLoggable("The import was successfull."));
    }
    return entity;
  }

  findAll() {
    return `This action returns all notification`;
  }

  findOne(id: number) {
    return `This action returns a #${id} notification`;
  }

  remove(id: number) {
    return `This action removes a #${id} notification`;
  }
}

/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { CALENDAR_CONFIG_TOKEN, CalendarConfig } from './calendar.config';
export { CalendarModule } from './calendar.module';
export { CalendarEventDto } from './dto/calendar-event.dto';
export { CalendarService } from './service/calendar.service';

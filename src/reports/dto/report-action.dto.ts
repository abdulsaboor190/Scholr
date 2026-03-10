import { IsEnum } from 'class-validator';

export enum ReportAction {
  REMOVE = 'REMOVE',
  WARN = 'WARN',
  SUSPEND = 'SUSPEND',
  DISMISS = 'DISMISS',
}

export class ReportActionDto {
  @IsEnum(ReportAction)
  action: ReportAction;
}

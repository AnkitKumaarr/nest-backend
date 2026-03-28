import { IsIn } from 'class-validator';

export class UpdatePlanDto {
  @IsIn(['basic', 'starter', 'premium'])
  planId: string;
}

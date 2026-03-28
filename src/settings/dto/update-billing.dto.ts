import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateBillingDto {
  @IsString()
  @IsNotEmpty()
  billingName: string;

  @IsString()
  @IsNotEmpty()
  billingAddress: string;

  @IsString()
  @IsNotEmpty()
  billingPhone: string;

  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}

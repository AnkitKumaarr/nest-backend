import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { SettingsService } from './settings.service';
import { CustomAuthGuard } from '../auth/guards/auth.guard';
import { UpdateNotificationsDto } from './dto/update-notifications.dto';
import { ToggleTwoFactorDto } from './dto/toggle-two-factor.dto';
import { UpdateExtensionsDto } from './dto/update-extensions.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdateAccountStatusDto } from './dto/update-account-status.dto';
import { ListInvoicesDto } from './dto/list-invoices.dto';
import {
  SkipThrottle,
  WriteThrottle,
  ReadThrottle,
  ExportThrottle,
} from '../common/decorators/throttle.decorator';

@Controller('settings')
@UseGuards(CustomAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /** GET /api/v1/settings — cheap single-document read, no limit needed */
  @SkipThrottle()
  @Get()
  getAll(@Request() req) {
    return this.settingsService.getAll(req.user.sub);
  }

  /** PATCH /api/v1/settings/notifications */
  @WriteThrottle()
  @Patch('notifications')
  updateNotifications(@Request() req, @Body() dto: UpdateNotificationsDto) {
    return this.settingsService.updateNotifications(req.user.sub, dto);
  }

  /** PATCH /api/v1/settings/security/two-factor */
  @WriteThrottle()
  @Patch('security/two-factor')
  toggleTwoFactor(@Request() req, @Body() dto: ToggleTwoFactorDto) {
    return this.settingsService.toggleTwoFactor(req.user.sub, dto);
  }

  /** GET /api/v1/settings/security/devices */
  @SkipThrottle()
  @Get('security/devices')
  getDevices(@Request() req) {
    return this.settingsService.getDevices(req.user.sub);
  }

  /** DELETE /api/v1/settings/security/devices */
  @WriteThrottle()
  @Delete('security/devices')
  @HttpCode(HttpStatus.OK)
  revokeAllDevices(@Request() req) {
    return this.settingsService.revokeAllOtherDevices(req.user.sub);
  }

  /** DELETE /api/v1/settings/security/devices/:id */
  @WriteThrottle()
  @Delete('security/devices/:id')
  @HttpCode(HttpStatus.OK)
  revokeDevice(@Request() req, @Param('id') id: string) {
    return this.settingsService.revokeDevice(req.user.sub, id);
  }

  /** PATCH /api/v1/settings/extensions */
  @WriteThrottle()
  @Patch('extensions')
  updateExtensions(@Request() req, @Body() dto: UpdateExtensionsDto) {
    return this.settingsService.updateExtensions(req.user.sub, dto);
  }

  /** POST /api/v1/settings/reset */
  @WriteThrottle()
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  resetToDefaults(@Request() req) {
    return this.settingsService.resetToDefaults(req.user.sub);
  }

  /** PATCH /api/v1/settings/account/status */
  @WriteThrottle()
  @Patch('account/status')
  updateAccountStatus(@Request() req, @Body() dto: UpdateAccountStatusDto) {
    return this.settingsService.updateAccountStatus(req.user.sub, dto);
  }

  /** GET /api/v1/settings/account/billing */
  @ReadThrottle()
  @Get('account/billing')
  getBilling(@Request() req) {
    return this.settingsService.getBilling(req.user.sub);
  }

  /** PATCH /api/v1/settings/account/billing */
  @WriteThrottle()
  @Patch('account/billing')
  updateBilling(@Request() req, @Body() dto: UpdateBillingDto) {
    return this.settingsService.updateBilling(req.user.sub, dto);
  }

  /** PATCH /api/v1/settings/account/plan */
  @WriteThrottle()
  @Patch('account/plan')
  updatePlan(@Request() req, @Body() dto: UpdatePlanDto) {
    return this.settingsService.updatePlan(req.user.sub, dto);
  }

  /** DELETE /api/v1/settings/account/plan */
  @WriteThrottle()
  @Delete('account/plan')
  @HttpCode(HttpStatus.OK)
  cancelPlan(@Request() req) {
    return this.settingsService.cancelPlan(req.user.sub);
  }

  /** GET /api/v1/settings/account/invoices */
  @ReadThrottle()
  @Get('account/invoices')
  getInvoices(@Request() req, @Query() dto: ListInvoicesDto) {
    return this.settingsService.getInvoices(req.user.sub, dto);
  }

  /** GET /api/v1/settings/account/invoices/:id/download — expensive PDF generation */
  @ExportThrottle()
  @Get('account/invoices/:id/download')
  async downloadInvoice(@Request() req, @Param('id') id: string, @Res() res: Response) {
    const invoice = await this.settingsService.getInvoiceForDownload(req.user.sub, id);
    const content = `Invoice ID: ${invoice.id}\nDate: ${invoice.date.toISOString().split('T')[0]}\nAmount: ${invoice.amount}\nStatus: ${invoice.status}`;
    const pdfContent = Buffer.from(
      `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n4 0 obj\n<< /Length ${content.length + 50} >>\nstream\nBT /F1 12 Tf 50 750 Td (${content.replace(/\n/g, ') Td (')}) Tj ET\nendstream\nendobj\nxref\n0 5\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n%%EOF`,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
      'Content-Length': pdfContent.length,
    });
    res.send(pdfContent);
  }
}

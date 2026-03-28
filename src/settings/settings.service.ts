import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateNotificationsDto } from './dto/update-notifications.dto';
import { ToggleTwoFactorDto } from './dto/toggle-two-factor.dto';
import { UpdateExtensionsDto } from './dto/update-extensions.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdateAccountStatusDto } from './dto/update-account-status.dto';
import { ListInvoicesDto } from './dto/list-invoices.dto';

const PLAN_CATALOG = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    priceUnit: 'month',
    features: ['100 tasks/month', '5 GB storage', '3 team members'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 4.99,
    priceUnit: 'month',
    features: ['200 meetings/month', '50 GB storage', '10 team members'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    priceUnit: 'month',
    features: ['Unlimited tasks', '500 GB storage', '50 team members'],
  },
];

const DEFAULT_SETTINGS = {
  notifications: {
    taskReminders: true,
    meetingReminders: true,
    challengeUpdates: false,
    systemUpdates: true,
    frequency: 'realtime',
  },
  security: { twoFactorEnabled: false },
  extensions: {
    floatingIcon: true,
    autoPinExtension: false,
    iconPosition: 'bottomRight',
  },
  account: {
    isActive: true,
    planId: 'starter',
    billing: {
      billingName: '',
      billingAddress: '',
      billingPhone: '',
      paymentMethodId: '',
    },
  },
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Internal: upsert default settings ──────────────────────────────────

  private async getOrCreate(userId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });
    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: { userId, ...DEFAULT_SETTINGS },
      });
    }
    return settings;
  }

  // ─── 1. Get all settings ─────────────────────────────────────────────────

  async getAll(userId: string) {
    const s = await this.getOrCreate(userId);
    return {
      notifications: s.notifications,
      security: s.security,
      extensions: s.extensions,
      account: s.account,
    };
  }

  // ─── 2. Save notification preferences ────────────────────────────────────

  async updateNotifications(userId: string, dto: UpdateNotificationsDto) {
    await this.getOrCreate(userId);
    await this.prisma.userSettings.update({
      where: { userId },
      data: { notifications: dto as any },
    });
    return { message: 'Notification preferences saved' };
  }

  // ─── 3. Toggle 2FA ────────────────────────────────────────────────────────

  async toggleTwoFactor(userId: string, dto: ToggleTwoFactorDto) {
    const s = await this.getOrCreate(userId);
    const security = (s.security as any) ?? {};
    security.twoFactorEnabled = dto.enabled;
    await this.prisma.userSettings.update({
      where: { userId },
      data: { security },
    });
    return {
      twoFactorEnabled: dto.enabled,
      message: dto.enabled
        ? 'Two-factor authentication enabled'
        : 'Two-factor authentication disabled',
    };
  }

  // ─── 4. List active device sessions ──────────────────────────────────────

  async getDevices(userId: string) {
    return this.prisma.deviceSession.findMany({
      where: { userId },
      orderBy: { lastActive: 'desc' },
    });
  }

  // ─── 5. Revoke one device session ────────────────────────────────────────

  async revokeDevice(userId: string, sessionId: string) {
    const session = await this.prisma.deviceSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Session not found');
    await this.prisma.deviceSession.delete({ where: { id: sessionId } });
    return { message: 'Session revoked' };
  }

  // ─── 6. Revoke all other sessions ────────────────────────────────────────

  async revokeAllOtherDevices(userId: string) {
    const result = await this.prisma.deviceSession.deleteMany({
      where: { userId, isCurrent: false },
    });
    return { message: `${result.count} other session(s) revoked` };
  }

  // ─── 7. Save extension preferences ───────────────────────────────────────

  async updateExtensions(userId: string, dto: UpdateExtensionsDto) {
    await this.getOrCreate(userId);
    await this.prisma.userSettings.update({
      where: { userId },
      data: { extensions: dto as any },
    });
    return { message: 'Extension preferences saved' };
  }

  // ─── 8. Reset all settings to defaults ───────────────────────────────────

  async resetToDefaults(userId: string) {
    await this.prisma.userSettings.upsert({
      where: { userId },
      update: { ...DEFAULT_SETTINGS },
      create: { userId, ...DEFAULT_SETTINGS },
    });
    return { message: 'Settings reset to defaults' };
  }

  // ─── 10. Toggle account active status ────────────────────────────────────

  async updateAccountStatus(userId: string, dto: UpdateAccountStatusDto) {
    const s = await this.getOrCreate(userId);
    const account = (s.account as any) ?? {};
    account.isActive = dto.isActive;
    await this.prisma.userSettings.update({
      where: { userId },
      data: { account },
    });
    return {
      isActive: dto.isActive,
      message: dto.isActive ? 'Account activated' : 'Account deactivated',
    };
  }

  // ─── 11. Get billing info & current plan ─────────────────────────────────

  async getBilling(userId: string) {
    const s = await this.getOrCreate(userId);
    const account = (s.account as any) ?? {};
    const planId = account.planId ?? 'starter';
    const billing = account.billing ?? {};

    const currentPlan = PLAN_CATALOG.find((p) => p.id === planId) ?? PLAN_CATALOG[1];
    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    const paymentMethods = billing.paymentMethodId
      ? [
          {
            id: billing.paymentMethodId,
            type: 'Visa',
            lastFour: '5678',
            expiry: '12/25',
            isDefault: true,
          },
        ]
      : [];

    return {
      currentPlan,
      billingCycle: 'monthly',
      nextPaymentDate: nextPaymentDate.toISOString().split('T')[0],
      billing: {
        billingName: billing.billingName ?? '',
        billingAddress: billing.billingAddress ?? '',
        billingPhone: billing.billingPhone ?? '',
      },
      paymentMethods,
      availablePlans: PLAN_CATALOG.map((p) => ({
        ...p,
        isCurrent: p.id === planId,
      })),
    };
  }

  // ─── 12. Update billing details ───────────────────────────────────────────

  async updateBilling(userId: string, dto: UpdateBillingDto) {
    const s = await this.getOrCreate(userId);
    const account = (s.account as any) ?? {};
    account.billing = {
      billingName: dto.billingName,
      billingAddress: dto.billingAddress,
      billingPhone: dto.billingPhone,
      paymentMethodId: dto.paymentMethodId,
    };
    await this.prisma.userSettings.update({
      where: { userId },
      data: { account },
    });
    return { message: 'Billing details updated' };
  }

  // ─── 13. Change / upgrade plan ────────────────────────────────────────────

  async updatePlan(userId: string, dto: UpdatePlanDto) {
    const s = await this.getOrCreate(userId);
    const account = (s.account as any) ?? {};
    account.planId = dto.planId;
    await this.prisma.userSettings.update({
      where: { userId },
      data: { account },
    });
    const plan = PLAN_CATALOG.find((p) => p.id === dto.planId);
    return {
      planId: dto.planId,
      message: `Plan upgraded to ${plan?.name ?? dto.planId}`,
    };
  }

  // ─── 14. Cancel current plan ──────────────────────────────────────────────

  async cancelPlan(userId: string) {
    const s = await this.getOrCreate(userId);
    const account = (s.account as any) ?? {};
    account.planId = 'basic';
    await this.prisma.userSettings.update({
      where: { userId },
      data: { account },
    });
    return {
      message: 'Plan cancelled. Access continues until end of billing period.',
    };
  }

  // ─── 15. List invoices ────────────────────────────────────────────────────

  async getInvoices(userId: string, dto: ListInvoicesDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where: { userId } }),
    ]);

    const data = invoices.map((inv) => ({
      id: inv.id,
      date: inv.date.toISOString().split('T')[0],
      amount: inv.amount,
      status: inv.status,
    }));

    return { data, total, page, limit };
  }

  // ─── 16. Download invoice PDF (stub) ─────────────────────────────────────

  async getInvoiceForDownload(userId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }
}

import { ChangeDetectorRef, Component } from '@angular/core';

// providers
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import {
  ActionSheetProvider,
  BitPayIdProvider,
  Logger,
  PersistenceProvider,
  PopupProvider
} from '../../../providers';

@Component({
  selector: 'page-bitpay-id',
  templateUrl: 'bitpay-id.html'
})
export class BitPayIdPage {
  public userBasicInfo;
  public accountInitials: string;
  public network;
  public originalBitpayIdSettings: string;
  public bitpayIdSettings = this.getDefaultBitPayIdSettings();

  constructor(
    private events: Events,
    private logger: Logger,
    private navParams: NavParams,
    private bitPayIdProvider: BitPayIdProvider,
    private navCtrl: NavController,
    private popupProvider: PopupProvider,
    private persistenceProvider: PersistenceProvider,
    private actionSheetProvider: ActionSheetProvider,
    private changeDetectorRef: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  async ionViewDidLoad() {
    this.userBasicInfo = this.navParams.data;
    if (this.userBasicInfo) {
      this.accountInitials = this.getBitPayIdInitials(this.userBasicInfo);
    }
    this.changeDetectorRef.detectChanges();
    this.network = this.bitPayIdProvider.getEnvironment().network;
    this.bitpayIdSettings =
      (await this.persistenceProvider.getBitPayIdSettings(this.network)) ||
      this.getDefaultBitPayIdSettings();
    this.originalBitpayIdSettings = JSON.stringify(this.bitpayIdSettings);
    this.logger.info('Loaded: BitPayID page');
  }

  ionViewWillLeave() {
    const settingsChanged =
      this.originalBitpayIdSettings !== JSON.stringify(this.bitpayIdSettings);
    if (settingsChanged) {
      this.events.publish('BitPayId/SettingsChanged');
    }
  }

  getDefaultBitPayIdSettings() {
    return {
      syncGiftCardPurchases: false
    };
  }

  async onSettingsChange() {
    await this.persistenceProvider.setBitPayIdSettings(
      this.network,
      this.bitpayIdSettings
    );
  }

  disconnectBitPayID() {
    this.popupProvider
      .ionicConfirm(
        this.translate.instant('Disconnect BitPay ID'),
        this.translate.instant(
          'Are you sure you would like to disconnect your BitPay ID?'
        )
      )
      .then(async () => {
        await this.bitPayIdProvider.disconnectBitPayID(
          () => null,
          err => {
            this.logger.log(err);
          }
        );

        const infoSheet = this.actionSheetProvider.createInfoSheet(
          'in-app-notification',
          {
            title: 'BitPay ID',
            body: this.translate.instant('BitPay ID successfully disconnected.')
          }
        );

        infoSheet.present();
        setTimeout(() => {
          this.navCtrl.popToRoot();
        }, 400);
      });
  }

  private getBitPayIdInitials(user): string {
    if (!user) return '';
    const { givenName, familyName } = user;
    return [givenName, familyName]
      .map(name => name && name.charAt(0).toUpperCase())
      .join('');
  }
}

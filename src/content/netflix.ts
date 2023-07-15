import { MediaScore, MediaScoreOpts } from './MediaScore';
import './netflix.scss';

const BUILD_IDENTIFIER_REGEXP = /\"BUILD_IDENTIFIER\":\"([a-z0-9]+)\"/;

class NetflixScore extends MediaScore {
  private apiBuildVersion?: string;

  constructor(options: MediaScoreOpts) {
    super(
      Object.assign(options, {
        serviceName: 'netflix',
      }),
    );

    if (!this.apiBuildVersion) {
      const groups = BUILD_IDENTIFIER_REGEXP.exec(
        window.document.body.innerHTML,
      );

      if (groups != null) {
        this.apiBuildVersion = groups[1];
      }
    }
  }

  protected getAttachTarget(target: Element) {
    return target.querySelector('.mini-modal-container');
  }

  protected getInfoTarget(target: Element) {
    return target.querySelector('.previewModal--wrapper') ?? target;
  }

  protected async getMediaInfo(target: Element) {
    const cardImg = target.querySelector('img.previewModal--boxart');
    const cardLink = target.querySelector('a.playLink');
    const info: MediaInfo = {
      apiBuildVersion: this.apiBuildVersion,
    };

    if (cardImg != null && cardLink != null) {
      const cardName = cardImg.getAttribute('alt');
      const cardId = cardLink.getAttribute('href');

      if (cardName && cardId) {
        info.title = cardName;
        info.id = cardId.replace(/\/watch\/([0-9]*).*/, '$1');
      }
    }

    return info;
  }
}

(function run() {
  const netflixScoreBar = new NetflixScore({
    observeRootSelector: '#appMountPoint',
  });

  netflixScoreBar.observe();
})();

import { MediaScore, MediaScoreOpts } from './MediaScore';
import './netflix.scss';

const BUILD_IDENTIFIER_REGEXP = /\"BUILD_IDENTIFIER\":\"([a-z0-9]+)\"/;

class NetflixScore extends MediaScore {
    private apiBuildVersion?: string;

    constructor(options: MediaScoreOpts) {
        super(
            Object.assign(options, {
                serviceName: 'netflix'
            })
        );

        if (!this.apiBuildVersion) {
            // @ts-ignore netflix
            this.apiBuildVersion = BUILD_IDENTIFIER_REGEXP.exec(
                window.document.body.innerHTML
            )[1];
        }
    }

    protected getAttachParent(target: Element) {
        return target.querySelector('.bob-overview');
    }

    protected checkTarget(target: Element) {
        return (
            target &&
            target.classList &&
            target.classList.contains('title-card') &&
            target.classList.contains('is-bob-open')
        );
    }

    protected async getMediaInfo(target: Element) {
        const cardLink = target.querySelector('a');
        const info: MediaInfo = {
            apiBuildVersion: this.apiBuildVersion
        };

        if (cardLink) {
            const cardName = cardLink.getAttribute('aria-label');
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
        oberveRootSelector: '.mainView'
    });

    netflixScoreBar.observe();
})();

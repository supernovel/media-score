import { MediaScore, MediaScoreOpts } from './MediaScore';
import './netflix.scss';

const BUILD_IDENTIFIER_REGEXP = /\"BUILD_IDENTIFIER\":\"([a-z0-9]+)\"/;

class NetflixScore extends MediaScore {
    public apiBuildVersion?: string;

    constructor(options: MediaScoreOpts) {
        super('netflix', options);

        if (!this.apiBuildVersion) {
            // @ts-ignore netflix
            this.apiBuildVersion = BUILD_IDENTIFIER_REGEXP.exec(
                window.document.body.innerHTML
            )[1];
        }
    }

    public getAttachParent(target: Element) {
        return target.querySelector('.bob-overview');
    }

    public isMediaInfoTarget(target: Element) {
        return (
            target &&
            target.classList &&
            target.classList.contains('title-card') &&
            target.classList.contains('is-bob-open')
        );
    }

    public async getMediaInfo(target: Element) {
        const cardLink = target.querySelector('a');
        const info: MediaInfo = {
            apiBuildVersion: this.apiBuildVersion
        };

        if (cardLink) {
            const cardName = cardLink.getAttribute('aria-label');
            const cardId = cardLink.getAttribute('href');

            console.debug(cardName, cardId);

            if (cardName && cardId) {
                info.title = cardName;
                info.id = cardId.replace(/\/watch\/([0-9]*).*/, '$1');
            }
        }

        return info;
    }
}

(() => {
    const netflixScoreBar = new NetflixScore({
        observeTarget: '.mainView'
    });

    netflixScoreBar.applyObserver();
})();

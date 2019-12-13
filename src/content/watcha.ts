import { MediaScore, MediaScoreOpts } from './MediaScore';
import './watcha.scss';

class WatchaScore extends MediaScore {
    constructor(options: MediaScoreOpts) {
        super('watcha', options);
    }

    public getAttachParent(target: Element) {
        return target.querySelector(`[class*="ContentInfo"]`);
    }

    public isMediaInfoTarget(target: Element) {
        return (
            target &&
            target.classList &&
            target.classList.value != null &&
            target.classList.contains('content-preview-enter-done') &&
            target.classList.value.indexOf('PreviewContainer') !== -1
        );
    }

    public async getMediaInfo(target: Element) {
        const cardNameElem = target.querySelector(`[class*="ContentTitle"]`);
        const cardIdElem = target.querySelector(
            `[class*="PlayableContentOverlay"]`
        );
        const info: MediaInfo = {};

        if (cardNameElem && cardIdElem) {
            const cardName = cardNameElem.textContent;
            const cardId = cardIdElem.getAttribute('href');

            console.debug(cardName, cardId);

            if (cardName && cardId) {
                info.title = cardName;
                info.id = cardId.replace(/\/watch\/([0-9a-zA-Z]*).*/, '$1');
            }
        }

        return info;
    }
}

(() => {
    const watchaScoreBar = new WatchaScore({
        observeTarget: `[class*="HomeColumnSection"]`
    });

    watchaScoreBar.applyObserver();
})();

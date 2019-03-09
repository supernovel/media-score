import {
    MediaScore,
    MediaScoreOpts
} from './MediaScore';
import './watcha.scss';

class WatchaScore extends MediaScore {
    constructor(options: MediaScoreOpts) {
        super('watcha', options);
    }

    public applyScoreBar(target: Element, scoreBar: Element) {
        const overlay = target.querySelector('.content-preview__info');

        if (overlay != null) {
            overlay.appendChild(scoreBar);
        }
    }

    public isMediaInfoTarget(target: Element) {
        return (
            target &&
            target.classList &&
            target.classList.contains('content') &&
            target.classList.contains('content--hovered')
        );
    }

    public async getMediaInfo(target: Element) {
        const cardNameElem = target.querySelector('.content__title');
        const cardIdElem = target.querySelector('.content-preview__play-overlay');
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
        observeTarget: '.app__page-mount'
    });

    watchaScoreBar.applyObserver();
})();
import { browser, Runtime } from 'webextension-polyfill-ts';

const OBSERVER_CHECK_INTERVAL = 500;

export abstract class MediaScore {
    private _targetObject = new Map<string, object>();
    private _observer: MutationObserver | undefined;
    private _observerCheckTimer: number | undefined;
    private _observeElement: Element | null | undefined;
    private _port: Runtime.Port;

    constructor(
        public serviceName: string = 'unknown',
        public options: MediaScoreOpts = {},
        public observeTarget: string | undefined = options.observeTarget,
        public mutationObserverOptions: MutationObserverInit = {
            attributes: true,
            attributeFilter: ['class'],
            childList: false,
            characterData: false,
            subtree: true
        }
    ) {
        if (
            typeof this.observeTarget != 'string' ||
            !this.observeTarget.length
        ) {
            throw new Error('observeTarget required! must be selector!');
        }

        this.mutationObserverOptions = Object.assign(
            this.mutationObserverOptions,
            options.mutationObserverOptions
        );

        /**
         * connect background script
         */
        this._port = browser.runtime.connect(undefined, {
            name: 'media_score'
        });

        this._port.onMessage.addListener(this._processMessage.bind(this));
    }

    public applyObserver() {
        if (this._observerCheckTimer) {
            clearTimeout(this._observerCheckTimer);
        }

        if (!this._applyObserver()) {
            this._observerCheckTimer = setTimeout(
                this.applyObserver.bind(this),
                OBSERVER_CHECK_INTERVAL
            );
        }
    }

    /**
     * Make sure it is a media info element.
     */
    public isMediaInfoTarget(target: Element): Boolean {
        return false;
    }

    /**
     * determine how to get media information
     */
    public async abstract getMediaInfo(target: Element): Promise<MediaInfo>;

    /**
     * determine where to attach the scoreBar
     */
    public abstract applyScoreBar(
        target: Element,
        scoreBar: Element
    ): void;

    private _processMessage(
        message: { id: string; data: ScoreInfos },
        port: Runtime.Port
    ) {
        const target = this._targetObject.get(message.id);
        const scoreBar = document.createElement('score-bar');

        console.debug('Content page received message', message, 'from', target);

        if (target == undefined) {
            return;
        }

        scoreBar.setAttribute('infos', JSON.stringify(message.data));

        this.applyScoreBar(
            target as Element,
            scoreBar
        );

        this._targetObject.delete(message.id);
    }

    private _processMutationRecords(mutationRecords: MutationRecord[]) {
        mutationRecords.forEach(async mutationRecord => {
            const target = mutationRecord.target;

            if (this.isMediaInfoTarget(target as Element)) {
                const mediaInfo = await this.getMediaInfo(target as Element);

                if (mediaInfo.title == null || mediaInfo.id == null) {
                    return;
                }

                this._targetObject.set(<string>mediaInfo.id, target);
                
                this._port.postMessage(
                    Object.assign(
                        {
                            serviceName: this.serviceName
                        },
                        mediaInfo
                    )
                );
            }
        });
    }

    private _applyObserver() {
        this._observeElement = document.querySelector(this
            .observeTarget as string);

        if (this._observeElement == null) {
            return false;
        }

        this._observer = new MutationObserver(
            this._processMutationRecords.bind(this)
        );

        this._observer.observe(
            this._observeElement,
            this.mutationObserverOptions
        );

        console.debug(`apply observer: ${this._observeElement}`);

        return true;
    }
}

export interface MediaScoreOpts {
    observeTarget?: string;
    mutationObserverOptions?: MutationObserverInit;
}

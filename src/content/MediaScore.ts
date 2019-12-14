import htm from 'htm';
import { h, render } from 'preact';
import { interval, Observable } from 'rxjs';
import {
    concatAll,
    concatMap,
    debounceTime,
    filter,
    first,
    map,
    tap
} from 'rxjs/operators';
import { browser, Runtime } from 'webextension-polyfill-ts';
import ScoreBar from './ScoreBar';

const html = htm.bind(h);

const OBSERVER_CHECK_INTERVAL = 500;
const OBSERVER_DEBOUNCE_TIME = 300;

const observeOnPort = (port: Runtime.Port): Observable<MediaInfoMessage> => {
    return new Observable(observer => {
        const listener = (message: MediaInfoMessage) => {
            observer.next(message);
        };

        port.onMessage.addListener(listener);

        const unsubscribe = () => {
            port.onMessage.removeListener(listener);
        };

        return unsubscribe;
    });
};

const observeOnMutation = (
    target: Node,
    config?: MutationObserverInit
): Observable<MutationRecord[]> => {
    return new Observable(observer => {
        const mutation = new MutationObserver((mutations, _) => {
            observer.next(mutations);
        });
        mutation.observe(target, config);
        const unsubscribe = () => {
            mutation.disconnect();
        };
        return unsubscribe;
    });
};

export abstract class MediaScore {
    private port: Runtime.Port;
    private portStream: Observable<{ id: string; data: MediaInfo }>;

    constructor(
        public options: MediaScoreOpts // public serviceName: string = 'unknown',
    ) {
        const {
            serviceName,
            oberveRootSelector,
            mutationObserverOptions
        } = options;

        if (
            typeof oberveRootSelector !== 'string' ||
            !oberveRootSelector.length
        ) {
            throw new Error('oberveRootSelector required! must be selector!');
        }

        this.options.serviceName = serviceName || 'unknown';
        this.options.mutationObserverOptions = Object.assign(
            {
                attributes: true,
                attributeFilter: ['class'],
                childList: false,
                characterData: false,
                subtree: true
            },
            mutationObserverOptions
        );

        this.port = browser.runtime.connect(undefined, {
            name: 'media_score'
        });
        this.portStream = observeOnPort(this.port);
    }

    public observe() {
        const {
            serviceName,
            oberveRootSelector,
            mutationObserverOptions
        } = this.options;

        if (oberveRootSelector == null) {
            return;
        }

        return interval(OBSERVER_CHECK_INTERVAL)
            .pipe(
                map(
                    (_): Element | null =>
                        document.querySelector(oberveRootSelector)
                ),
                filter((element): element is Element => element != null),
                first()
            )
            .pipe(
                concatMap(element =>
                    observeOnMutation(element, mutationObserverOptions).pipe(
                        concatAll()
                    )
                ),
                map(record => record.target as Element),
                filter(element => this.checkTarget(element)),
                debounceTime(OBSERVER_DEBOUNCE_TIME),
                concatMap(element => {
                    return new Observable<RenderArgs>(observer => {
                        let isSubscribe = true;

                        Promise.resolve(this.getMediaInfo(element))
                            .then(
                                value =>
                                    isSubscribe &&
                                    observer.next({ element, info: value })
                            )
                            .catch(
                                error => isSubscribe && observer.error(error)
                            )
                            .finally(() => isSubscribe && observer.complete());

                        return () => {
                            isSubscribe = false;
                        };
                    });
                }),
                map(({ element, info }: RenderArgs) => {
                    const parent = this.getAttachParent(element);
                    let attachTarget;

                    if (parent != null) {
                        attachTarget = document.createElement('div');
                        parent.append(attachTarget);
                    }

                    return { element: attachTarget, info };
                }),
                filter(
                    ({ element, info }: RenderArgs) =>
                        element != null && info.title != null && info.id != null
                ),
                tap(console.debug),
                tap(this.render),
                concatMap(({ element, info }: RenderArgs) => {
                    return new Observable<RenderArgs>(observer => {
                        this.portStream
                            .pipe(
                                map(
                                    (message: MediaInfoMessage) => message.data
                                ),
                                filter(data => data.id === info.id)
                            )
                            .subscribe(data => {
                                observer.next({ element, info: data });
                                observer.complete();
                            });

                        this.port.postMessage({
                            id: info.id,
                            data: Object.assign(
                                {
                                    serviceName
                                },
                                info
                            )
                        });
                    });
                }),
                filter(
                    ({ element }: RenderArgs) => element.parentElement != null
                ),
                tap(console.debug),
                tap(this.render)
            )
            .subscribe();
    }

    protected render({ element, info }: RenderArgs) {
        render(
            html`
                <${ScoreBar} info="${info}"><//>
            `,
            element
        );
    }

    protected getAttachParent(element: Element): Element | null {
        return element;
    }

    protected checkTarget(element: Element): boolean {
        return false;
    }

    protected getMediaInfo(element: Element): MediaInfo {
        return {};
    }

    // // tslint:disable: variable-name
    // private _targetObject = new Map<string, object>();
    // private _observer: MutationObserver | undefined;
    // private _observerCheckTimer: number | undefined;
    // private _observeElement: Element | null | undefined;
    // private _port: Runtime.Port;
    // // tslint:enable: variable-name

    // constructor(
    //     public serviceName: string = 'unknown',
    //     public options: MediaScoreOpts = {},
    //     public observeTarget: string | undefined = options.observeTarget,
    //     public mutationObserverOptions: MutationObserverInit = {
    //         attributes: true,
    //         attributeFilter: ['class'],
    //         childList: false,
    //         characterData: false,
    //         subtree: true
    //     }
    // ) {
    //     if (
    //         typeof this.observeTarget !== 'string' ||
    //         !this.observeTarget.length
    //     ) {
    //         throw new Error('observeTarget required! must be selector!');
    //     }

    //     this.mutationObserverOptions = Object.assign(
    //         this.mutationObserverOptions,
    //         options.mutationObserverOptions
    //     );

    //     /**
    //      * connect background script
    //      */
    //     this._port = browser.runtime.connect(undefined, {
    //         name: 'media_score'
    //     });

    //     this._port.onMessage.addListener(this._processMessage.bind(this));
    // }

    // public applyObserver() {
    //     if (this._observerCheckTimer) {
    //         clearTimeout(this._observerCheckTimer);
    //     }

    //     if (!this._applyObserver()) {
    //         this._observerCheckTimer = setTimeout(
    //             this.applyObserver.bind(this),
    //             OBSERVER_CHECK_INTERVAL
    //         );
    //     }
    // }

    // /**
    //  * Make sure it is a media info element.
    //  */
    // public isMediaInfoTarget(target: Element): boolean {
    //     return false;
    // }

    // /**
    //  * determine how to get media information
    //  */
    // public abstract async getMediaInfo(target: Element): Promise<MediaInfo>;

    // public abstract getAttachParent(target: Element): Element | null;

    // /**
    //  * determine where to attach the scoreBar
    //  */
    // public attachScoreBar(target: Element, info: MediaInfo) {
    //     render(
    //         html`
    //             <${ScoreBar} info="${info}"><//>
    //         `,
    //         target
    //     );
    // }

    // private _processMessage(
    //     message: { id: string; data: MediaInfo },
    //     port: Runtime.Port
    // ) {
    //     const target = this._targetObject.get(message.id);

    //     console.debug('Content page received message', message, 'from', target);

    //     // tslint:disable-next-line: triple-equals
    //     if (target != null) {
    // const parent = this.getAttachParent(target as Element);

    // if (parent != null) {
    //     const attachTarget = document.createElement('div');
    //     parent.append(attachTarget);
    //     this.attachScoreBar(attachTarget, message.data as MediaInfo);
    // }
    //     }

    //     this._targetObject.delete(message.id);
    // }

    // private _processMutationRecords(mutationRecords: MutationRecord[]) {
    //     mutationRecords.forEach(async mutationRecord => {
    //         const target = mutationRecord.target;

    //         if (this.isMediaInfoTarget(target as Element)) {
    //             const mediaInfo = await this.getMediaInfo(target as Element);

    //             if (
    // mediaInfo.title == null ||
    // mediaInfo.id == null ||
    //                 this._targetObject.has(mediaInfo.id as string)
    //             ) {
    //                 return;
    //             }

    //             this._targetObject.set(mediaInfo.id as string, target);

    //             this._port.postMessage(
    // Object.assign(
    //     {
    //         serviceName: this.serviceName
    //     },
    //     mediaInfo
    // )
    //             );
    //         }
    //     });
    // }

    // private _applyObserver() {
    //     this._observeElement = document.querySelector(this
    //         .observeTarget as string);

    //     if (this._observeElement == null) {
    //         return false;
    //     }

    //     this._observer = new MutationObserver(
    //         this._processMutationRecords.bind(this)
    //     );

    //     this._observer.observe(
    //         this._observeElement,
    //         this.mutationObserverOptions
    //     );

    //     console.debug(`apply observer: ${this._observeElement}`);

    //     return true;
    // }
}

interface RenderArgs {
    element: Element;
    info: MediaInfo;
}

export interface MediaScoreOpts {
    serviceName?: string;
    oberveRootSelector?: string;
    mutationObserverOptions?: MutationObserverInit;
}

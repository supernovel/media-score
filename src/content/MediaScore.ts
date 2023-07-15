import htm from 'htm';
import { h, render } from 'preact';
import { Observable, interval, of } from 'rxjs';
import {
  catchError,
  concatMap,
  filter,
  map,
  tap
} from 'rxjs/operators';
import browser, { Runtime } from 'webextension-polyfill';
import ScoreBar from './ScoreBar';

const html = htm.bind(h);

const OBSERVER_CHECK_INTERVAL = 500;
const MediaScoreWrapperClass = 'media-score-wrapper';

const observeOnPort = (port: Runtime.Port): Observable<MediaInfoMessage> => {
  return new Observable((observer) => {
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

export abstract class MediaScore {
  private port: Runtime.Port;
  private portStream: Observable<{ id: string; data: MediaInfo }>;

  constructor(
    public options: MediaScoreOpts, // public serviceName: string = 'unknown',
  ) {
    const { serviceName, observeRootSelector } = options;

    if (
      typeof observeRootSelector !== 'string' ||
      !observeRootSelector.length
    ) {
      throw new Error('observeRootSelector required! must be selector!');
    }

    this.options.serviceName = serviceName || 'unknown';

    this.port = browser.runtime.connect(undefined, {
      name: 'media_score',
    });
    this.portStream = observeOnPort(this.port);
  }

  public observe() {
    const { serviceName, observeRootSelector } = this.options;

    if (observeRootSelector == null) {
      return;
    }

    return interval(OBSERVER_CHECK_INTERVAL)
      .pipe(
        map((): Element | null => document.querySelector(observeRootSelector)),
        filter((element): element is Element => element != null),
      )
      .pipe(
        map((element) => this.getInfoTarget(element)),
        filter((element) => {
          if (element == null) {
            return false;
          }

          const attachTarget = this.getAttachTarget(element);

          if (attachTarget == null) {
            return false;
          }

          if (
            attachTarget?.querySelector(`.${MediaScoreWrapperClass}`) != null
          ) {
            return false;
          }

          return true;
        }),
        concatMap((element) => {
          return new Observable<RenderArgs>((observer) => {
            let isSubscribe = true;

            Promise.resolve(this.getMediaInfo(element))
              .then(
                (value) =>
                  isSubscribe && observer.next({ element, info: value }),
              )
              .catch((error) => console.error(error))
              .finally(() => isSubscribe && observer.complete());

            return () => {
              isSubscribe = false;
            };
          }).pipe(catchError(() => of<RenderArgs>()));
        }),
        map(({ element, info }: RenderArgs) => {
          const attachTarget = this.getAttachTarget(element);
          const container = document.createElement('div');

          container.classList.add(MediaScoreWrapperClass);
          attachTarget?.append(container);

          return { element: container, info };
        }),
        filter((args?: RenderArgs) => args != null),
        tap(console.debug),
        tap(this.render),
        tap(({ element, info }: RenderArgs) => {
          const subscription = this.portStream.subscribe(
            (message: MediaInfoMessage) => {
              if (message.id == info.id) {
                this.render({ element, info: message.data });
                subscription.unsubscribe();
              }
            },
          );

          this.port.postMessage({
            id: info!.id,
            data: Object.assign(
              {
                serviceName,
              },
              info,
            ),
          });
        }),
      )
      .pipe(catchError(() => of<RenderArgs>()))
      .subscribe();
  }

  protected render({ element, info }: RenderArgs) {
    render(html` <${ScoreBar} info="${info}"><//> `, element!);
  }

  protected getAttachTarget(element: Element): Element | null {
    return element;
  }

  protected getInfoTarget(element: Element): Element {
    return element;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getMediaInfo(_element: Element): MediaInfo {
    return {};
  }
}

interface RenderArgs {
  element: Element;
  info: MediaInfo;
}

export interface MediaScoreOpts {
  serviceName?: string;
  observeRootSelector?: string;
}

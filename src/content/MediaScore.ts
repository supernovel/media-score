import htm from 'htm';
import { h, render } from 'preact';
import { interval, Observable, of } from 'rxjs';
import {
  concatAll,
  concatMap,
  debounceTime,
  filter,
  first,
  map,
  tap,
  catchError,
} from 'rxjs/operators';
import browser, { Runtime } from 'webextension-polyfill';
import ScoreBar from './ScoreBar';

const html = htm.bind(h);

const OBSERVER_CHECK_INTERVAL = 500;
const OBSERVER_DEBOUNCE_TIME = 300;
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

const observeOnMutation = (
  target: Node,
  config?: MutationObserverInit,
): Observable<MutationRecord[]> => {
  return new Observable((observer) => {
    const mutation = new MutationObserver((mutations) => {
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
    public options: MediaScoreOpts, // public serviceName: string = 'unknown',
  ) {
    const { serviceName, observeRootSelector, mutationObserverOptions } =
      options;

    if (
      typeof observeRootSelector !== 'string' ||
      !observeRootSelector.length
    ) {
      throw new Error('observeRootSelector required! must be selector!');
    }

    this.options.serviceName = serviceName || 'unknown';
    this.options.mutationObserverOptions = Object.assign(
      {
        attributes: true,
        attributeFilter: ['class'],
        childList: false,
        characterData: false,
        subtree: true,
      },
      mutationObserverOptions,
    );

    this.port = browser.runtime.connect(undefined, {
      name: 'media_score',
    });
    this.portStream = observeOnPort(this.port);
  }

  public observe() {
    const { serviceName, observeRootSelector, mutationObserverOptions } =
      this.options;

    if (observeRootSelector == null) {
      return;
    }

    return interval(OBSERVER_CHECK_INTERVAL)
      .pipe(
        map((): Element | null => document.querySelector(observeRootSelector)),
        filter((element): element is Element => element != null),
        first(),
      )
      .pipe(
        concatMap((element) =>
          observeOnMutation(element, mutationObserverOptions)
            .pipe(concatAll())
            .pipe(catchError(() => of<MutationRecord>())),
        ),
        map((record) => record.target as Element),
        filter((element) => this.checkTriggerTarget(element)),
        map((element) => this.getInfoTarget(element)),
        debounceTime(OBSERVER_DEBOUNCE_TIME),
        filter((element) => {
          if (element == null) {
            return false;
          }

          const attachParent = this.getAttachParent(element);

          if (attachParent == null) {
            return false;
          }

          if (
            attachParent?.querySelector(`.${MediaScoreWrapperClass}`) != null
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
          const parent = this.getAttachParent(element);
          const attachTarget = document.createElement('div');

          attachTarget.classList.add(MediaScoreWrapperClass);
          parent?.append(attachTarget);

          return { element: attachTarget, info };
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

  protected getAttachParent(element: Element): Element | null {
    return element;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected checkTriggerTarget(_element: Element): boolean {
    return false;
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
  mutationObserverOptions?: MutationObserverInit;
}

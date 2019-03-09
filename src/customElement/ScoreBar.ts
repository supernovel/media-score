import '@webcomponents/webcomponentsjs/webcomponents-bundle.js';

import { LitElement, html, css, property, customElement } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat';

@customElement('score-bar')
export class ScoreBar extends LitElement {
    static styles = css`
        :host {
            display: flex;
            pointer-events: all;
        }
    `;
    @property({ type: Object }) infos: ScoreInfos = {};

    render() {
        return html`
            ${repeat(Object.entries(this.infos), (value, index) => {
                const [provider, info] = value;

                return html`
                    <score-text
                        provider="${provider}"
                        info="${JSON.stringify(info)}"
                    ></score-text>
                `;
            })}
        `;
    }
}

@customElement('score-text')
export class ScoreText extends LitElement {
    static styles = css`
        :host([hidden]) { display: none; }
        :host {
            display: flex;
            align-items: center;
            margin-right: 0.5rem;
            pointer-events: all;
            cursor: pointer;
        }
        img {
            margin-right: 0.4rem;
            width: 1.5rem;
            height: 1.5rem;
            transition:width 0.5s, height 0.5s;
        }
        span {
            font-size: 1.2rem;
        }

        :host(:hover) img{
            width: 1.7rem;
            height: 1.7rem;
        }
    `;

    @property({ type: String }) provider: string = 'unknown';
    @property({ type: Object }) info: ScoreInfo = {};

    firstUpdated(changedProperties: Map<string, any>){
        this.addEventListener('click', this.openPage);
    }

    updated(changedProperties: Map<string, any>) {
        this.hidden = !this.isVisible();
    }

    isVisible(): boolean{
        return !!(this.info.img && this.getScore(this.info));
    }

    getScore(info: ScoreInfo) {
        return Math.floor(info.score || 0);
    }

    openPage(event: Event) {
        const url = this.info.url;

        if(url){
            window.open(url)
        }

        event.preventDefault();
        event.stopPropagation();
    }

    render() {
        return html`
            <img
                src="${this.info.img}"
                title="${this.provider}"
            />
            <span>${this.getScore(this.info)}</span>
        `;
    }
}

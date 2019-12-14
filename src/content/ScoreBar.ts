import { h } from 'preact';
import htm from 'htm';
import styled from 'styled-components';

const html = htm.bind(h);

const ScoreBarWrapper = styled.div`
    display: flex;
    pointer-events: all;
`;

export default function ScoreBar({ info }: { info: MediaInfo }) {
    const isLoading: boolean = info.additional == null;
    let children;

    if (isLoading) {
        children = html`<div>Loading...</div>`;
    } else {
        children = Object.entries(info.additional || {}).map(value => {
            const [provider, additionalInfo] = value;

            return html`
                <${ScoreItem}
                    provider="${provider}"
                    info="${additionalInfo}"
                ><//>
            `;
        });
    }

    return html`
        <${ScoreBarWrapper}> ${children} <//>
    `;
}

const ScoreItemWrapper = styled.div`
    display: flex;
    align-items: center;
    margin-right: 0.5rem;
    pointer-events: all;
    cursor: pointer;

    &[hidden] {
        display: none;
    }

    img {
        margin-right: 0.4rem;
        width: 1.5rem;
        height: 1.5rem;
        transition: width 0.5s, height 0.5s;
    }
    span {
        font-size: 1.2rem;
    }

    :host(:hover) img {
        width: 1.7rem;
        height: 1.7rem;
    }
`;

function ScoreItem({ info, provider }) {
    const score = Math.floor(info.score || 0);
    const hidden = !(info.img && score);
    const openPage = (event: Event) => {
        const { url } = info;

        if (url) {
            window.open(url);
        }

        event.preventDefault();
        event.stopPropagation();
    };

    return html`
        <${ScoreItemWrapper} hidden="${hidden}">
            <img src="${info.img}" title="${provider}" onClick="${openPage}" />
            <span>${score}</span>
        <//>
    `;
}

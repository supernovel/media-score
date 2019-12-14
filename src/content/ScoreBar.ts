import { h } from 'preact';
import htm from 'htm';
import styled from 'styled-components';

const html = htm.bind(h);

const ScoreBarWrapper = styled.div`
    display: flex;
    align-items: center;
    pointer-events: all;
    padding: 5px;
    line-height: 1;
    font-size: calc(12px + 6 * ((100vw - 300px) / (1600 - 300)));

    .loadingText {
        margin-left: 5px;
    }
`;

export default function ScoreBar({ info }: { info: MediaInfo }) {
    const isLoading: boolean = info.additional == null;
    let children;

    if (isLoading) {
        children = html`
            <${Spinner}><//>
            <span class="loadingText">Loading score...</span>
        `;
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
        width: 1.5em;
        height: 1.5em;
        transition: width 0.5s, height 0.5s;
    }

    span {
        font-size: 1em;
    }

    &:hover img {
        width: 1.7em;
        height: 1.7em;
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

const SpinnerWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;

    position: relative;
    font-size: 2em;
    width: 1em;
    height: 1em;

    div {
        box-sizing: border-box;
        display: block;
        position: absolute;
        width: 0.7em;
        height: 0.7em;
        border: 0.1em solid #fff;
        border-radius: 50%;
        animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        border-color: #fff transparent transparent transparent;
    }
    div:nth-child(1) {
        animation-delay: -0.45s;
    }
    div:nth-child(2) {
        animation-delay: -0.3s;
    }
    div:nth-child(3) {
        animation-delay: -0.15s;
    }
    @keyframes lds-ring {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
`;

function Spinner() {
    return html`
        <${SpinnerWrapper}>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        <//>
    `;
}

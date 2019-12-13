import test from 'ava';
import browserEnv from 'browser-env';

import * as tmdb from '../src/background/info/tmdb';
import * as imdb from '../src/background/info/imdb';
import * as watcha from '../src/background/info/watcha';
import * as rottenTomatoes from '../src/background/info/rottenTomatoes';

const locale = 'ko-KR';

browserEnv();

const testObject = {
    id: '80180171',
    title: '킹덤',
    titleEn: 'Kingdom',
    type: 'show',
    year: 2019
};

test('Tmdb Score', async t => {
    const data = await tmdb.getInfo(testObject, locale);

    t.snapshot(data);
});

test('Imdb Score', async t => {
    const data = await imdb.getInfo(testObject);

    t.snapshot(data);
});

test('Watcha Score', async t => {
    const data = await watcha.getInfo(testObject, locale);

    t.snapshot(data);
});

test('RottenTomatoes Score', async t => {
    const data = await rottenTomatoes.getInfo(testObject);

    t.snapshot(data);
});
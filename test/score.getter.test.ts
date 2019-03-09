import test from 'ava';
import browserEnv from 'browser-env';

import Tmdb from '../src/background/score/Tmdb';
import Imdb from '../src/background/score/Imdb';
import Watcha from '../src/background/score/Watcha';
import RottenTomatoes from '../src/background/score/RottenTomatoes';

const locale = 'ko-KR';

Tmdb.applyLocale(locale);
Imdb.applyLocale(locale);
Watcha.applyLocale(locale);
RottenTomatoes.applyLocale(locale);

browserEnv();

const testObject = {
    id: '80180171',
    title: '킹덤',
    titleEn: 'Kingdom',
    type: 'show',
    year: 2019
};

test('Tmdb Score', async t => {
    const data = await Tmdb.get(testObject);

    t.snapshot(data);
});

test('Imdb Score', async t => {
    const data = await Imdb.get(testObject);

    t.snapshot(data);
});

test('Watcha Score', async t => {
    const data = await Watcha.get(testObject);

    t.snapshot(data);
});

test('RottenTomatoes Score', async t => {
    const data = await RottenTomatoes.get(testObject);

    t.snapshot(data);
});
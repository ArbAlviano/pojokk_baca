const { test } = require('node:test');
const assert = require('node:assert');
const { resolveBookFromCache } = require('../lib/resolveBook');

function sampleBook() {
    return {
        id_buku: 1,
        judul: '2359',
        penulis: 'Brian Khrisna',
        genre: 'Umum',
        textContent: '... teks raksasa ...'
    };
}

test('resolveBookFromCache mengembalikan metadata buku tanpa textContent', () => {
    const result = resolveBookFromCache([sampleBook()], 1);

    assert.strictEqual(result.judul, '2359');
    assert.strictEqual(result.penulis, 'Brian Khrisna');
    assert.ok(!('textContent' in result), 'textContent harus dibuang dari respons');
});

test('resolveBookFromCache menggabungkan field extra ke hasil', () => {
    const result = resolveBookFromCache([sampleBook()], 1, { waktu_baca: '2026-08-28T00:00:00Z' });

    assert.strictEqual(result.waktu_baca, '2026-08-28T00:00:00Z');
    assert.strictEqual(result.judul, '2359');
});

test('resolveBookFromCache mengembalikan null untuk id yang tidak ada', () => {
    const result = resolveBookFromCache([sampleBook()], 999);

    assert.strictEqual(result, null);
});

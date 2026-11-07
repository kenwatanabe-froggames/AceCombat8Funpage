# AC8 機体レベルアップ一覧

機体を選ぶと、Lv.1〜20 ごとの搭載弾数と上昇項目が表示される静的サイトです。ビルド不要で、この html フォルダがそのまま公開用です。

## ファイル
- `index.html` — ページ本体
- `data.js` — 11機分のデータ(`window.AC8_DATA`)。`file://` で開いても動くよう JSON ではなく JS にしています
- `assets/style.css`, `assets/app.js` — 見た目と表示ロジック

## ローカルで確認
`index.html` をブラウザで開くだけで動きます。

## Cloudflare Pages で公開
### ダッシュボードから(いちばん簡単)
1. Cloudflare ダッシュボード → Workers & Pages → Create → Pages → Upload assets
2. プロジェクト名を決め、この `html` フォルダをドラッグ&ドロップ
3. Deploy

### wrangler から
```
cd ac8
npx wrangler pages deploy html --project-name ac8
```
Git 連携にする場合は、Build command を空に、Build output directory を `html` にします。

## 機体の追加・修正
`data.js` を編集します。機体は次の形です。
```
{ "id": "F-15E", "name": "F-15E", "cost": 1700,
  "cols": ["GUN","MSL"],
  "levels": [ { "lv": 1, "cap": 5, "ammo": {"GUN": 800, "MSL": 122}, "up": ["なし"] } ] }
```
URL の `#F-15E` のように、機体の id を付けるとその機体を直接開けます。

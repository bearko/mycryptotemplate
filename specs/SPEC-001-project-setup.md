# SPEC-001 — Project Setup (MyCryptoSurvivor Day 1 Bootstrap)

- **Status**: Done
- **Author**: bearko
- **Created**: 2026-05-09
- **Updated**: 2026-05-09
- **Phase 担当**: Day 1 (= Bootstrap)

## 1. 背景 / 課題

`bearko/mycryptotemplate` をベースに **MyCryptoSurvivor** を起ち上げる。
Day 1 では「テンプレート由来のひな形が動いていて、 SPEC-002 以降のゲーム機能実装に着手できる状態」 を作る必要がある。

具体的に解く課題:

- テンプレートに残っている `<prefix>` / `ProjectName` / `<user>/<asset-repo>` を MyCryptoSurvivor 用に置換する
- `PROJECT_CHARTER.md` を MyCryptoSurvivor 用に書き換える (= ぶれない軸を作る)
- 「Day 1 モック」 として **タイトル → ヒーロー選択 (見た目だけのスタブ)** が動く状態を作る (= ステークホルダーに見せられる最小成果物)

## 2. ゴール

1. `index.html` がブラウザで Console エラーなしに開く
2. Splash → Title → Home (= ヒーロー選択トリガ) の遷移が動く
3. JP / EN 切替が全画面で機能する
4. `pauseFlags` パターンに準拠したモーダル開閉が 1 つ以上実装されている (= ヘルプモーダル + ヒーロー選択モーダル)
5. PC (1280×800) + Mobile (375×667) でレイアウト破綻しない
6. `PROJECT_CHARTER.md` が MyCryptoSurvivor 用に埋まっている
7. localStorage prefix `mcs.*` で永続化される

## 3. 非ゴール

- ヒーロー選択モーダルでの実データ表示 (= Day 1 はプレースホルダで OK)
- ステージ選択画面の実装 (= SPEC-003 以降)
- ゲームプレイ画面の実装 (= SPEC-005 以降)
- 効果音 / BGM 再生 (= SPEC-007 以降)
- ランキング / GAS 連携 (= 将来の SPEC)
- セーブ / ロード (= MyCryptoSurvivor では非対応の方針)

## 4. ユーザー体験

### 4.1 シナリオ

1. プレイヤーが `index.html` を開く
2. Splash 画面が一瞬表示され、 Loading 文言が出る (= i18n 読み込み中)
3. i18n 読み込み完了 → Title 画面に遷移
4. Title 画面で言語トグル (JP / EN) が選べる (= 既定は localStorage / ブラウザ言語から決定)
5. **Press to Start** ボタン押下で Home 画面に遷移
6. Home 画面のヘッダーに `MyCryptoSurvivor` タイトル + 言語トグル + ヘルプ (?) ボタン
7. Stage 領域に **「ヒーローを選ぶ」** ボタン (= Day 1 のスタブ機能)
8. ボタン押下で「ヒーロー選択モーダル」 が開く (= `pauseTime`)
9. モーダルには Common ヒーロー 10 体分のプレースホルダタイル (= 画像なし、 名前 + 番号のみ) が並ぶ
10. タイル押下で「Coming soon: SPEC-002 で本実装」 のマイ・トーストが出てモーダルは開いたまま
11. モーダル閉じる (= 背景クリック / × ボタン / Esc) で `resumeTime`

### 4.2 UI モック (ASCII)

```
┌─────────────────────────────────────────────────────────────┐
│ MyCryptoSurvivor      [JP/EN]  [?]                          │  ← header
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ヒーローを選んで出発しよう                                │
│                                                             │
│            [  ヒーローを選ぶ  ]                             │  ← stub trigger
│                                                             │
└─────────────────────────────────────────────────────────────┘

ヒーロー選択モーダル (= pauseTime 中):
┌─────────────────────────────────────────────────────────────┐
│ ヒーローを選ぶ                                       [×]    │
├─────────────────────────────────────────────────────────────┤
│  [#01]  [#02]  [#03]  [#04]  [#05]                          │
│  [#06]  [#07]  [#08]  [#09]  [#10]                          │
│                                                             │
│  ※ Coming soon: SPEC-002 で本実装                           │
└─────────────────────────────────────────────────────────────┘
```

## 5. 技術設計

### 5.1 データ

`state` への追加なし (Day 1 段階)。 SPEC-002 以降で `state.selectedHero` などを足す。

### 5.2 関数

`js/main.js` に追加 (= テンプレート既存関数を再利用、 新規は最小限):

| 関数名 | 役割 | 入力 | 出力 |
|---|---|---|---|
| `setupHeroSelectStub()` | ヘッダー / Stage の起動時バインド | – | – |
| `openHeroSelect()` | ヒーロー選択モーダルを開く (= `pauseTime`) | – | – |
| `closeHeroSelect()` | ヒーロー選択モーダルを閉じる (= `resumeTime`) | – | – |
| `renderHeroSelectStub()` | プレースホルダタイルを 10 個描画 | – | – |
| `pickHeroPlaceholder(idx)` | タイル押下ハンドラ (= 一時トースト) | `idx: number` | – |

### 5.3 フロー

```
init()
  └─ pauseTime()                 (splash 中は停止)
  └─ initI18n()                   (data/i18n/ui.json 読込)
  └─ splash hidden / title shown
  └─ resumeTime()
  └─ setupTitleScreen()
  └─ setupHelpOverlay()           (= pauseTime/resumeTime 対応の既存実装)
  └─ setupLangToggle()
  └─ setupHeroSelectStub()        ← NEW
  └─ startTimeLoop()              (= 1s tick、 paused 中は no-op)

[Press Start]
  └─ dismissTitle() → #app shown

[「ヒーローを選ぶ」 ボタン]
  └─ openHeroSelect()
       ├─ pauseTime()
       └─ #heroSelectModal shown
       └─ renderHeroSelectStub()  (= 10 タイル DOM 生成)

[タイル click]
  └─ pickHeroPlaceholder(idx)
       └─ showStubToast("Coming soon: SPEC-002")

[× / 背景 / Esc]
  └─ closeHeroSelect()
       ├─ #heroSelectModal hidden
       └─ resumeTime()
```

## 6. 実装フェーズ

| Phase | 内容 | PR | Status |
|---|---|---|---|
| 0 | SPEC docs (= 本ファイル) + PROJECT_CHARTER 更新 | #1 (本 PR に同梱) | Done |
| 1 | `<prefix>` / ProjectName 置換 + ASSET_BASE 設定 + ヒーロー選択スタブ + i18n キー | #1 (本 PR) | Done |

(= Day 1 は Phase 0/1 を 1 PR にまとめる、 規模が小さいため)

## 7. テストケース (= 受入基準)

### 7.1 起動

- [ ] `index.html` をブラウザで開いて Splash が一瞬出る
- [ ] Console に `init failed` などの致命的エラーがない
- [ ] Title 画面で MyCryptoSurvivor 文字列が表示される

### 7.2 言語

- [ ] Title 画面の JP / EN ボタンで切替できる
- [ ] `localStorage.getItem("mcs.lang")` が `"en"` 等で永続化される
- [ ] Header の `JP/EN` ボタンで切替できる
- [ ] 全 `data-i18n` 要素が切替時に textContent 更新される

### 7.3 Press Start

- [ ] Press to Start で `#titleScreen` が hidden、 `#app` が表示される

### 7.4 Help モーダル

- [ ] ? ボタンでヘルプモーダルが開く (= `state.pauseFlags > 0`)
- [ ] 閉じるボタン / 背景 / Esc いずれでも閉じる
- [ ] 閉じた後 `state.pauseFlags === 0` に戻る

### 7.5 ヒーロー選択スタブ (Day 1 の核)

- [ ] 「ヒーローを選ぶ」 ボタンが Stage 領域に表示される
- [ ] 押下で `#heroSelectModal` が開く (= `state.pauseFlags > 0`)
- [ ] プレースホルダタイル 10 個 (= `#01`〜`#10`) が表示される
- [ ] タイル押下で「Coming soon: SPEC-002」 トーストが出る (= モーダルは開いたまま)
- [ ] × ボタン / 背景クリック / Esc で閉じる
- [ ] 閉じた後 `state.pauseFlags === 0` に戻る

### 7.6 レイアウト

- [ ] PC (1280×800) でヘッダー / Stage がはみ出さない
- [ ] Mobile (375×667) でヒーローモーダルが画面内に収まる (= 縦スクロール OK)

### 7.7 prefix

- [ ] `js/constants.js` の `LS_PREFIX === "mcs"` である
- [ ] 起動後 `localStorage.getItem("mcs.lang")` が読める

## 8. リスク・懸念

- **テンプレ由来 docs に `<prefix>` が残ったまま**: `docs/setup/new-project.md` のみ意図的に残している (= 派生プロジェクト起ち上げの教材として再利用)。 派生時は Charter での explicit な記述で対応する
- **アセット未配置**: `bearko/MyCryptoSurvivor-assets` repo はまだ存在しない可能性。 Day 1 では `img()` を使わないのでビルド時エラーは出ないが、 SPEC-002 でヒーロー画像表示時に補完が必要
- **タイトル画面のロゴ**: テキストのみ (= プレースホルダ)。 β1 までに本物のロゴ素材へ差し替え予定

## 9. 参考

- `CLAUDE.md` — 命名 / pauseFlags 不変条件 / 作法
- `docs/patterns/04-time-and-modals.md` — pauseFlags パターン
- `docs/patterns/02-screen-structure.md` — Splash / Title / Home の遷移
- `docs/patterns/03-i18n-and-help.md` — `data-i18n` + `applyDataI18n`
- `docs/charters/PROJECT_CHARTER.md` — MyCryptoSurvivor の目的・スコープ
- `docs/process/SPEC_DRIVEN_DEVELOPMENT.md` — Spec ライフサイクル

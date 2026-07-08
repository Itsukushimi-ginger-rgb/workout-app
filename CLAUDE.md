# 筋トレ記録アプリ — Claude向けコンテキスト

## プロジェクト概要
個人用筋トレ記録・次回処方自動計算アプリ。要件定義書 `筋トレ進行・記録アプリ_要件定義書_v3.0.md` に基づいて構築。

## 技術スタック
- React + TypeScript (Vite)
- Tailwind CSS (`@tailwindcss/vite`)
- Dexie.js (IndexedDB) + `dexie-react-hooks`
- React Router v6

## デプロイ情報
- **本番URL**: https://workout-app-xi-ruby.vercel.app
- **GitHubリポジトリ**: https://github.com/Itsukushimi-ginger-rgb/workout-app
- **Vercelプロジェクト**: itsukushimi-ginger-rgbs-projects/workout-app
- **自動デプロイ**: `git push` → Vercelが自動ビルド・デプロイ

## ローカル開発
```bash
cd /Users/gakuotorii/workout-app
npm run dev        # 開発サーバー起動 (localhost:5173)
npm run build      # 本番ビルド
git push           # デプロイ（Vercelが自動実行）
```

## 重要なファイル構成
```
src/
├── data/
│   ├── db.ts          # Dexieスキーマ
│   ├── types.ts       # 全型定義・TRAINING_BLOCKS定数
│   └── seeds.ts       # 初期種目データ（7種目）
├── logic/
│   ├── judge.ts       # 二重ゴール判定・RIR判定
│   ├── progression.ts # フェーズ進行ロジック
│   └── prescription.ts # 次回処方計算
├── screens/           # 各画面コンポーネント
├── hooks/
│   ├── useSession.ts  # セッション管理
│   └── useExercise.ts # 種目状態取得
└── App.tsx            # ルーティング定義
```

## 種目一覧
| ID | 名前 | 特記事項 |
|---|---|---|
| incline_bench | インクラインベンチプレス | |
| barbell_curl | バーベルカール | deltaAlt あり |
| squat | スクワット | |
| db_shoulder_press | シーテッドDBショルダープレス | |
| skull_crusher | スカルクラッシャー | |
| pullup | 懸垂 | loadMode: assist |
| ab_roller | 腹筋ローラー | isBodyweightOnly, 常にfinalフェーズ |

## フェーズシステム
intro1 → intro2 → intro3 → intro4 → final
- 各introフェーズで1セットペアずつ追加
- 2連続未達で次フェーズへ進行
- finalフェーズは各ペアが独立して進行

## 注意事項
- IndexedDBはブラウザ端末ごとに別管理（ログイン不要・端末保存）
- 設定画面で初回setup（isSetup: true）が必要な種目は赤枠で表示される
- 腹筋ローラーはセット数無制限・2連続3回以下で終了

# 筋トレ記録アプリ

個人用の筋トレ記録・次回処方自動計算アプリ。

## アプリURL

**https://workout-app-xi-ruby.vercel.app**

iPhoneのSafariで開いて「ホーム画面に追加」するとアプリのように使えます。

---

## デプロイ手順

コードを変更した後は以下を実行するだけで自動デプロイされます。

```bash
cd /Users/gakuotorii/workout-app

# 変更をGitHubにプッシュ → Vercelが自動でビルド・公開
git add -A
git commit -m "変更内容の説明"
git push
```

数分後に本番URLに反映されます。

---

## ローカルで動作確認する場合

```bash
cd /Users/gakuotorii/workout-app
npm run dev
```

ブラウザで http://localhost:5173 を開く。

---

## 関連リンク

| 項目 | URL |
|---|---|
| アプリ（本番） | https://workout-app-xi-ruby.vercel.app |
| GitHubリポジトリ | https://github.com/Itsukushimi-ginger-rgb/workout-app |
| Vercelダッシュボード | https://vercel.com/itsukushimi-ginger-rgbs-projects/workout-app |

---

## セキュリティ上の注意

### GitHubのメール確認コード（sudoモード）
GitHubでアプリのインストールや高権限操作をするとき、登録メールに8桁のコードが届く場合があります。
**このコードは絶対に他人（AIを含む）に教えないでください。**
自分でブラウザに直接入力する操作です。

### Vercel・GitHubのアクセス権限
- VercelのGitHub Appは `workout-app` リポジトリのみにアクセスを限定して設定済み（全リポジトリではない）
- 万が一不審なアクセスがあった場合は GitHub → Settings → Applications から権限を取り消せます

---

## トラブルシューティング

### デプロイが反映されない
Vercelのダッシュボードでビルドログを確認してください。
https://vercel.com/itsukushimi-ginger-rgbs-projects/workout-app

### データが消えた
データはブラウザのIndexedDBに保存されています。ブラウザのデータ削除・キャッシュクリアをすると消えます。
異なるブラウザ・端末からは別のデータとして扱われます。

### 種目の初回設定が必要
アプリの設定画面で赤枠の種目は初回の開始負荷を入力して「保存」してください。

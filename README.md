# 補助金かんたん検索

**🔗 Live: [jgrants-matching.vercel.app](https://jgrants-matching.vercel.app)**

日本の経済産業省 jGrants 公式APIで募集中の補助金を検索し、質問に答えながら申請書の下書きを作り、審査基準チェックリストで点検してWordファイルとして出力するサービスです。検索・企業情報・ログイン・端末間同期・文書ダウンロードは実際に動作します。AI生成機能（構成案・下書き・評価・おすすめ）はコード実装済みですが、まだ無料APIキーが接続されておらず実際の出力は未確認です。

A service that searches open subsidies through the official jGrants API (Japan's METI), walks you through questions to draft an application, checks it against a review-criteria checklist, and exports a Word file. Search, company info, login, cross-device sync and document download all work for real. The AI generation features (outline, draft, evaluation, recommendations) are coded but not yet connected to a free API key, so real model output hasn't been verified.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

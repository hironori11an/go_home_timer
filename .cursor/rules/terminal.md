# Terminal Integration Rules

## コマンド実行時の注意事項

1. **長時間実行コマンドの場合**
   - `is_background: true`を設定する
   - 進行状況を確認できる方法を提供する

2. **コマンド終了の明示**
   - 可能な限り`&& echo "SUCCESS"` または `|| echo "FAILED"`を追加
   - タイムアウトが予想される場合は`timeout`コマンドを使用

3. **インタラクティブコマンドの回避**
   - 必要に応じて`--yes`、`-y`、`--force`等の非インタラクティブフラグを使用
   - パイプで`| cat`を追加してページャーを無効化

4. **作業ディレクトリの明示**
   - コマンド実行前に現在のディレクトリを確認
   - 必要に応じて`cd`コマンドを含める

## 推奨パターン

```bash
# 良い例
cd /path/to/project && npm install --yes && echo "INSTALL_COMPLETED"

# 悪い例（終了が不明確）
npm install
``` 
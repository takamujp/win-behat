win-behat
=========

win-behat
------------
windows用のbehatのGUI


実行方法
-----------------
前提

* php5.3以上をインストールされていて環境変数にパスが通っていること

[ここ](http://mumu.sharuru07.jp/download/win-behat.zip)からwin-behatをダウンロードして解凍、解凍したディレクトリにあるwin-behat.exeを実行

behatがインストールされていない場合は、内蔵しているbehat(v2.4)を使用するので、  
別のバージョンを使用したい場合は、behatをインストールしてパスを通しておくと、パスが通っている方を使用するようになる


実行ファイルの作成方法
--------------
1. behatディレクトリに、behatをインストールする
2. behat、build、package.jsonをzipに固めて、拡張子を.nwにする(ここではwin-behat.nwと扱う)
3. https://github.com/rogerwang/node-webkit からwindow用のnode-webkitをダウンロードして解凍する
4. 解凍したディレクトリに、win-behat.nwを配置
5. コマンドプロンプで以下のコマンド実行  
```
cd win-behatのディレクトリ
copy /b nw.exe+win-behat.nw win-behat.exe nw.exe

<?php
  $lang = 'en';
  if (isset($_GET['uk'])) $lang = 'uk';
?>
<!DOCTYPE html>
<html lang="<?= $lang; ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <link rel="stylesheet" type="text/css" href="life.css">
  <script>var LifeGameLang = {};</script>
  <script src="lang/en.js"></script>
  <script src="lang/uk.js"></script>
  <script src="life.js"></script>
  <title></title>
</head>
<body>

  <h1></h1>

  <div id="board"></div>

  <div id="panel">
    <div id="info-panel">
      <h4></h4>
      <div id="info-status"><span class="red-text"></span></div>
      <div id="info-generation"><span></span></div>
      <div id="info-cell-info"><span class="italic-text"></span></div>
      <div id="info-delay"><span></span></div>
      <div id="info-board-size"><span></span></div>
      <div id="info-cell-size"><span></span></div>
      <div id="info-board-type"><span></span></div>
    </div>

    <div id="flow-control-panel" class="panel-group">
      <input type="button" id="cycle" data-state="stopped" value="">
      <input type="button" id="one" value="">
      <label><input type="number" id="delay" min="0" max="3600000" value="1000" maxlength="7"></label>
    </div>

    <div id="pause-after-panel" class="panel-group">
      <label id="pa-stop-label"><input type="checkbox" id="pa-switch"></label>
      <label id="pa-generations-label"><input type="number" id="pa-generations" min="0" max="9999" value="10" maxlength="4"></label>
      <div id="pa-from">
        <label><input type="radio" name="pause-after" value="beginning" checked></label>
        <label><input type="radio" name="pause-after" value="current"></label>
      </div>
    </div>

    <div id="change-size-panel" class="panel-group">
      <label><input type="number" id="change-size" min="1" max="99" value="5" maxlength="2"></label>
    </div>

    <div id="new-game-panel" class="panel-group">
      <h4></h4>
      <div class="panel-line"><label><input type="number" id="new-game-x" min="1" max="9999" value="200" placeholder="x" maxlength="4"></label>&#8201;&#215;&#8201;<label><input type="number" id="new-game-y" min="1" max="9999" value="100" placeholder="y" maxlength="4"></label></div>
      <div class="panel-line"><label><input type="checkbox" id="new-game-fit"></label></div>
      <div class="panel-line"><label><select id="new-game-filling">
        <option value="random-25" selected="selected"></option>
        <option value="all-dead"></option>
        <option value="all-alive"></option>
      </select></label></div>
      <div class="panel-line"><input type="button" id="new-game-start" value=""></div>
    </div>

    <div id="board-engine-panel" class="panel-group">
      <h4></h4>
      <div class="panel-line"><label><input type="radio" name="engine" value="Canvas" id="engine-canvas" checked="checked"></label><label><input type="radio" name="engine" value="DOM" id="engine-dom"></label></div>
    </div>

    <div id="tip-panel" class="panel-group"></div>
  </div>

  <div id="footer">&copy; 2014, chugylo <br></div>

  <ul id="lang">
    <li id="lang-en"><?php if ('en' != $lang): ?><a href="?en">eng</a><?php else: ?>eng<?php endif; ?></li>
    <li id="lang-uk"><?php if ('uk' != $lang): ?><a href="?uk">укр</a><?php else: ?>укр<?php endif; ?></li>
  </ul>

</body>
</html>

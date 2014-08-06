<?php
  $lang = 'en';
  if (isset($_GET['uk'])) $lang = 'uk';
?>
<!DOCTYPE html>
<html lang="<?= $lang; ?>">
<head>
  <meta charset="utf-8">
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
      <div id="info-board-type"><span></span></div>
    </div>

    <div id="flow-control-panel" class="panel-group">
      <input type="button" id="run" data-state="stopped" value="">
      <label><input type="number" id="delay" min="0" max="3600000" value="1000" maxlength="7"></label>
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
    <li id="lang-en"><a href="?en">eng</a></li>
    <li id="lang-uk"><a href="?uk">укр</a></li>
  </ul>

</body>
</html>

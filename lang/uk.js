var LifeGame = (function(module) {

module.lang = module.lang || {};

module.lang.uk = {
    title: "Гра «Життя»"
  , header: "Гра «Життя»"

  , fitAlert: "Смуги прокрутки будуть приховані і гра почнеться автоматично. Натисніть клавішу ESC, щоб показати смуги прокрутки знову."
  , hugeConfirm1: "Ви намагаєтесь створити величезну дошку ("
  , hugeConfirm2: " клітин). Підтвердити?"

    // PANEL
    // p - prefix for a panel
    // pi - prefix for an info panel
  , pInfo: "Інфо"
  , piStatus: "Статус: "
  , piStatusStopped: "зупинено"
  , piStatusRunning: "грає"
  , piStatusPaused: "на паузі"
  , piGeneration: "Покоління: "
  , piCellInfo: "Клітина: "
  , piCellInfoEmpty: "&lt;Наведіть мишку на дошку, щоб побачити&gt;"
  , piCellInfoLive: "жива"
  , piCellInfoDead: "мертва"
  , piCellInfoBorder: "&lt;Межа клітини&gt;"
  , piPeriod: "Період: "
  , piMs: "мс"
  , piGps: "поколінь/с"
  , piBoardSize: "Розмір дошки: "
  , piCells: "клітин"
  , piCellSize: "Розмір клітини: "
  , piRules: "Правила: "
  , piMouseStroke: "Рисування мишею: "
  , piFree: "вільне"
  , piStraight: "пряме"
  , piBoardEngine: "Двигун гри: "
  , pStep: "Період: "
  , pStepMs: "&#8201;мс"
  , pCycle: "Цикл"
  , pOne: "+Одне"
  , pPause: "Пауза"

  , pPaStop: " Пауза після&nbsp;"
  , pPaGenerations: " поколінь"
  , pPaBeginning: " від початку"
  , pPaCurrent: " від поточного"

  , pCellSize: "Розмір клітини: "
  , pPx: "&#8201;пкс"

  , pMouseStroke: "Рисування мишею: "
  , pFree: "вільне"
  , pStraight: "пряме"

  , pNewGame: "Нова гра"
  , pBoardSize: "Розмір дошки: "
  , pFit: " Підлаштувати під розмір вікна"
  , pRules: "Правила: "
  , pFilling: "Початковий вміст: "
  , pGolden: "Випадково, використовуючи золотий перетин"
  , pAllDead: "Всі мертві"
  , pAllLive: "Всі живі"
  , pStart: "Почати нову гру"
  , pBoardEngine: "Двигун гри"
  , pCanvasEngine: " Canvas"
  , pDOMEngine: " DOM"
  , pCanvasEngineTitle: "Швидкий, рекомендований"
  , pDOMEngineTitle: "Повільний, не рекомендований"
  , pSave: "Зберегти як зображення"
  , pTip: "Клікайте лівою кнопкою миші, щоб оживити клітину або правою, щоб умертвити."
        + "<p>Правила мають формат \"В/Н\", де \"В\" означає \"виживання\", а \"Н\"&nbsp;— \"народження\". Популярні правила: 23/3&nbsp;— класична гра, 34/34, 23/36&nbsp;— HighLife."
  , pWhatsit: "Гра «Життя» — це клітинний автомат, гра для нуля гравців, у якій дія відбувається на площині, поділеній на клітини. Кожне наступне покоління вираховується за станом попереднього за простими правилами. Детальніше <a href=\"http://uk.wikipedia.org/wiki/%D0%96%D0%B8%D1%82%D1%82%D1%8F_(%D0%B3%D1%80%D0%B0)\" target=\"_blank\">у Вікіпедії</a>."

  , rights: "<a href=\"LICENSE\">Інформація про ліцензію.</a>"

  , langEnTitle: "Англійська мова (English)"
  , langUkTitle: "Українська мова"

  , game: "Гра"
  , help: "Довідка"
}

return module;

})(LifeGame || {});

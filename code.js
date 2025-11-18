function doGet(e) {
  Logger.log('doGet function is running - serving webapp.html');
  return HtmlService.createHtmlOutputFromFile('webapp')
    .setTitle('Dunhams Scheduler')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

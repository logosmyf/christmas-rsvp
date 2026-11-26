const RSVP_TAB = 'Registrations 2026';
const WEBSITE_URL = 'https://logosmyf.github.io/christmas-rsvp/';
const HEADERS = [
  'Submitted at', 'Full Name', 'Contact Number', 'Food Name', 'Food Category',
  'Wish 1', 'Wish 2', 'Wish 3', 'Additional Notes', 'Submission ID'
];
const FOOD_CATEGORIES = {
  main: '主食',
  snack: '小吃',
  dessert: '甜点',
  drink: '饮料',
  other: '其他'
};
const REGISTRATION_CONFIG = {
  deadline: '2026-12-12T23:59:59+08:00',
  enforceDeadline: false
};
const FIELD_LIMITS = {
  fullName: 100, contactNumber: 30, foodName: 200,
  wish1: 300, wish2: 300, wish3: 300, notes: 1000
};

function setupRsvp() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Open this script from the private registration spreadsheet.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = spreadsheet.getSheetByName(RSVP_TAB) || spreadsheet.insertSheet(RSVP_TAB);
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    assertHeaders(sheet);

    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setBackground('#710f1c').setFontColor('#fff8eb').setFontWeight('bold');
    sheet.setColumnWidth(1, 170);
    sheet.setColumnWidths(2, 4, 155);
    sheet.setColumnWidths(6, 4, 250);
    sheet.getRange('A2:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.getRange('C2:C').setNumberFormat('@');
    sheet.getRange('F2:I').setWrap(true);
    sheet.hideColumns(HEADERS.length);
    SpreadsheetApp.flush();
    PropertiesService.getScriptProperties().setProperty('RSVP_SPREADSHEET_ID', spreadsheet.getId());
  } finally {
    lock.releaseLock();
  }
}

function assertHeaders(sheet) {
  if (!sheet || sheet.getLastColumn() !== HEADERS.length) {
    throw new Error('Registrations 2026 has a missing or unexpected schema.');
  }
  const headers = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (HEADERS.some((header, index) => header !== headers[index])) {
    throw new Error('The columns in Registrations 2026 do not match the expected headers.');
  }
}

function doGet() {
  return responsePage('LOGOSMYF 圣诞派对', '请在圣诞邀请函填写报名表。');
}

function doPost(event) {
  const rsvp = parseRsvp(event?.parameter ?? {});
  if (!rsvp) return responsePage('请检查报名资料', '请返回上一页，检查必填项目和联系号码后再试。');

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('RSVP_SPREADSHEET_ID');
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(RSVP_TAB);
    assertHeaders(sheet);
    const lastRow = sheet.getLastRow();
    const alreadySaved = lastRow > 1 && sheet.getRange(2, HEADERS.length, lastRow - 1, 1)
      .createTextFinder(rsvp.id).matchEntireCell(true).findNext();

    if (!alreadySaved) {
      if (REGISTRATION_CONFIG.enforceDeadline && Date.now() > Date.parse(REGISTRATION_CONFIG.deadline)) {
        return responsePage('报名已截止', '感谢你的关注！你仍可返回圣诞邀请函查看活动详情。');
      }
      sheet.appendRow([
        new Date(),
        safeSheetText(rsvp.fullName),
        rsvp.contactNumber ? "'" + rsvp.contactNumber : '',
        safeSheetText(rsvp.foodName),
        rsvp.foodCategory,
        safeSheetText(rsvp.wish1),
        safeSheetText(rsvp.wish2),
        safeSheetText(rsvp.wish3),
        safeSheetText(rsvp.notes),
        rsvp.id
      ]);
      SpreadsheetApp.flush();
    }
  } catch (error) {
    console.error('Christmas registration could not be saved.');
    return responsePage('暂时无法确认报名', '请使用浏览器的返回按钮，稍后再次提交。');
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }

  return responsePage('🎉 报名成功！', '谢谢你的报名！我们已经收到你的资料啦！', true);
}

function parseRsvp(values = {}) {
  const id = String(values.submissionId ?? '').trim().toLowerCase();
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id)) return null;

  const registration = { id };
  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    const value = String(values[field] ?? '').trim();
    if (value.length > limit) return null;
    registration[field] = value;
  }

  const category = String(values.foodCategory ?? '').trim();
  if (!Object.prototype.hasOwnProperty.call(FOOD_CATEGORIES, category)) return null;
  registration.foodCategory = FOOD_CATEGORIES[category];

  const phone = registration.contactNumber;
  if (!registration.fullName || !registration.foodName || !registration.wish1 ||
      !/^\+?[\d(). -]+$/.test(phone) || !/\d/.test(phone)) return null;

  return registration;
}

function safeSheetText(value) {
  // Preserve literal text for both formulas and values beginning with an apostrophe.
  return /^[=+@\-']/.test(value) ? "'" + value : value;
}

function responsePage(title, message, success = false) {
  // All strings interpolated into this page are fixed by this script.
  const details = success ? `
    <p>🎄 期待与你一起度过一个充满爱、欢乐与祝福的圣诞节！</p>
    <p>📅 2026年12月20日（星期日）<br>⏰ 请于 <strong>5:45pm</strong> 抵达</p>
    <p>我们圣诞派对见！❤️</p>` : '';
  return HtmlService.createHtmlOutput(`<!doctype html>
    <html lang="zh-CN"><head><meta charset="utf-8"><base target="_top"><style>
      body { margin: 0; background: #710f1c; color: #382a26; font: 1rem/1.8 system-ui, sans-serif; }
      main { max-width: 32rem; margin: 8vh auto; padding: clamp(1rem, 5vw, 3rem);
        width: min(100% - 2rem, 32rem); box-sizing: border-box; text-align: center;
        background: #fff8eb; border: 5px double #d9b66f; }
      h1 { color: #710f1c; font: 400 clamp(1.8rem, 7vw, 3rem) Georgia, serif; }
      a { display: inline-flex; align-items: center; min-height: 44px; color: #710f1c; font-weight: 700; }
      .illustration { font-size: 3rem; }
      @media (prefers-reduced-motion: no-preference) {
        .illustration { animation: appear .55s ease-out both; }
        @keyframes appear { from { transform: translateY(.4rem); opacity: .3; } }
      }
    </style></head><body><main>
      <div class="illustration" aria-hidden="true">${success ? '🎄 🎁' : '✦'}</div>
      <h1>${title}</h1><p>${message}</p>${details}
      <a href="${WEBSITE_URL}">返回圣诞邀请函</a>
    </main></body></html>`)
    .setTitle(title).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

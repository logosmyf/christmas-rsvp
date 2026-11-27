// Paste this file into a standalone Apps Script project owned by the organiser.
const RSVP_BACKUP_SOURCE_ID = 'PASTE_REGISTRATION_SPREADSHEET_ID_HERE';
const RSVP_BACKUP_TIME_ZONE = 'Asia/Kuala_Lumpur';
const RSVP_BACKUP_PREFIX = 'Christmas RSVP Backup ';
const RSVP_BACKUP_FOLDER_KEY = 'RSVP_BACKUP_FOLDER_ID';
const RSVP_BACKUP_HOURS = 48;
const RSVP_BACKUP_DAYS = 14;

function setupHourlyRsvpBackup() {
  backupRsvpSpreadsheet();
  const triggers = ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'backupRsvpSpreadsheet');
  if (triggers.length === 0) {
    ScriptApp.newTrigger('backupRsvpSpreadsheet').timeBased().everyHours(1).create();
  }
}

function backupRsvpSpreadsheet() {
  if (RSVP_BACKUP_SOURCE_ID === 'PASTE_REGISTRATION_SPREADSHEET_ID_HERE') {
    throw new Error('Set RSVP_BACKUP_SOURCE_ID to the registration spreadsheet ID first.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const source = DriveApp.getFileById(RSVP_BACKUP_SOURCE_ID);
    if (source.getMimeType() !== MimeType.GOOGLE_SHEETS) {
      throw new Error('The configured backup source must be a Google spreadsheet.');
    }

    const properties = PropertiesService.getScriptProperties();
    const folderId = properties.getProperty(RSVP_BACKUP_FOLDER_KEY);
    const folder = folderId
      ? DriveApp.getFolderById(folderId)
      : DriveApp.createFolder('Christmas RSVP Backups');

    if (folder.isTrashed() || folder.getSharingAccess() !== DriveApp.Access.PRIVATE ||
        folder.getEditors().length || folder.getViewers().length) {
      throw new Error('Use an active private backup folder owned by the organiser.');
    }
    properties.setProperty(RSVP_BACKUP_FOLDER_KEY, folder.getId());

    const marker = 'Automatic RSVP backup of ' + RSVP_BACKUP_SOURCE_ID;
    const now = new Date();
    const hour = Utilities.formatDate(now, RSVP_BACKUP_TIME_ZONE, 'yyyy-MM-dd HH');
    const backups = [];
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      const name = file.getName();
      if (file.isTrashed() || file.getId() === source.getId() ||
          file.getMimeType() !== MimeType.GOOGLE_SHEETS ||
          file.getDescription() !== marker || !name.startsWith(RSVP_BACKUP_PREFIX)) continue;
      const stamp = name.slice(RSVP_BACKUP_PREFIX.length);
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(stamp)) backups.push({ file, stamp });
    }

    if (!backups.some(backup => backup.stamp.startsWith(hour + ':'))) {
      const stamp = Utilities.formatDate(now, RSVP_BACKUP_TIME_ZONE, 'yyyy-MM-dd HH:mm:ss');
      const file = source.makeCopy(RSVP_BACKUP_PREFIX + stamp, folder);
      file.setDescription(marker);
      backups.push({ file, stamp });
    }

    backups.sort((a, b) => b.stamp.localeCompare(a.stamp));
    const dailyCutoff = Utilities.formatDate(new Date(now.getTime() - (RSVP_BACKUP_DAYS - 1) * 86400000),
      RSVP_BACKUP_TIME_ZONE, 'yyyy-MM-dd');
    const retainedDays = new Set();
    backups.forEach(({ file, stamp }, index) => {
      const day = stamp.slice(0, 10);
      const daily = day >= dailyCutoff && !retainedDays.has(day);
      if (daily) retainedDays.add(day);
      if (index >= RSVP_BACKUP_HOURS && !daily) file.setTrashed(true);
    });

    return folder.getUrl();
  } finally {
    lock.releaseLock();
  }
}

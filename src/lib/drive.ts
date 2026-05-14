import { google } from 'googleapis';
import { Readable } from 'stream';

function getDriveClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google OAuth credentials in environment');
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });

  return google.drive({ version: 'v3', auth });
}

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
}

export async function uploadToDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<DriveUploadResult> {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const { data: file } = await drive.files.create({
    requestBody: {
      name: filename,
      parents: folderId ? [folderId] : undefined,
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: 'id, webViewLink',
  });

  if (!file.id) throw new Error('Drive upload returned no file id');

  // Make the file viewable by anyone with the link
  await drive.permissions.create({
    fileId: file.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return {
    fileId: file.id,
    webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
  };
}

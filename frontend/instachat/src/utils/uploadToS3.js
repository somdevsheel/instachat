export const uploadToS3 = async ({ uploadUrl, fileUri, mimeType }) => {
  const response = await fetch(fileUri);
  const fileBlob = await response.blob();

  await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
    },
    body: fileBlob,
  });
};

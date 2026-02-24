import { put } from '@vercel/blob';

async function test() {
  try {
    const blob = await put('test.txt', 'Hello World', {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    console.log("Success:", blob.url);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();

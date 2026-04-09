import sharp from "sharp";

// Shared concurrency limiter for all sharp operations across the app.
// Prevents overwhelming external/slow drives (e.g. exFAT SSD).
const MAX_CONCURRENCY = 4;
let running = 0;
const queue = [];

function acquire() {
  if (running < MAX_CONCURRENCY) {
    running += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => queue.push(resolve));
}

function release() {
  if (queue.length > 0) {
    const next = queue.shift();
    next();
  } else {
    running -= 1;
  }
}

export async function sharpTransform(absolutePath, { resize, jpeg }) {
  await acquire();
  try {
    return await sharp(absolutePath)
      .rotate()
      .resize(resize)
      .jpeg(jpeg)
      .toBuffer();
  } finally {
    release();
  }
}

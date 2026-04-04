const fs = require("fs");
const path = require("path");

const songsDir = path.join(__dirname, "songs");

const AUDIO_EXTENSIONS = [
  ".mp3",
  ".mpeg",
  ".mp4",
  ".wav",
  ".ogg"
];

function isAudio(file) {
  return AUDIO_EXTENSIONS.includes(
    path.extname(file).toLowerCase()
  );
}

function generateIndexes() {
  if (!fs.existsSync(songsDir)) {
    console.log("songs folder not found");
    return;
  }

  const albums = [];

  const folders = fs.readdirSync(
    songsDir,
    { withFileTypes: true }
  );

  folders.forEach(folder => {
    if (!folder.isDirectory()) return;

    const folderName = folder.name;
    const folderPath = path.join(
      songsDir,
      folderName
    );

    const files = fs.readdirSync(folderPath);

    const songs = files.filter(isAudio);

    if (songs.length === 0) return;

    albums.push(folderName);

    const indexPath = path.join(
      folderPath,
      "index.json"
    );

    fs.writeFileSync(
      indexPath,
      JSON.stringify(songs, null, 2)
    );

    console.log(
      `Created index.json for ${folderName}`
    );
  });

  const albumsIndexPath = path.join(
    songsDir,
    "index.json"
  );

  fs.writeFileSync(
    albumsIndexPath,
    JSON.stringify(albums, null, 2)
  );

  console.log("Created songs/index.json");
}

generateIndexes();
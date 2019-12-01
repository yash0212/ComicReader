const path = require("path");
const fs = require("fs");
const unzipper = require("unzipper");
const unrar = require("electron-unrar-js");
const imageFormats = [".jpg", ".png", ".webp"];
const sharp = require("sharp");

process.on("message", async file => {
	if (
		path.extname(file.path) === ".cbz" ||
		path.extname(file.path) === ".zip"
	) {
		let imgFound = 0;
		fs.createReadStream(file.path)
			.pipe(unzipper.Parse())
			.on("entry", async function(entry) {
				const fileName = entry.path;
				const type = entry.type; // 'Directory' or 'File'
				let fileExt = path.extname(fileName);
				let obj;
				if (
					!imgFound &&
					type == "File" &&
					imageFormats.includes(fileExt)
				) {
					imgFound = 1;
					obj = await entry.buffer();

					//Generate thumbnail data
					imgData = (
						await sharp(obj)
							.resize(100, 150)
							.webp({ quality: 60 })
							.toBuffer()
					).toString("base64");

					//Return thumbnail data back to renderer
					process.send({
						thumbnailData: imgData,
						thumbnailExt: fileExt,
						file: file
					});
				} else {
					entry.autodrain();
				}
			});
	} else if (
		path.extname(file.path) === ".cbr" ||
		path.extname(file.path) === ".rar"
	) {
		// Read the archive file into a typedArray
		var buf = Uint8Array.from(fs.readFileSync(file.path)).buffer;
		var extractor = unrar.createExtractorFromData(buf);

		var fileList = extractor.getFileList();
		if (fileList[0].state === "SUCCESS") {
			let found = 0;
			var thumbnailFileName = fileList[1].fileHeaders
				.sort((a, b) =>
					a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 0
				)
				.filter(x => {
					if (!found && imageFormats.includes(path.extname(x.name))) {
						found = 1;
						return true;
					}
				})
				.map(x => x.name);

			var extracted = extractor.extractFiles([thumbnailFileName[0]]);

			if (extracted[0].state === "SUCCESS") {
				if (extracted[1].files[0].extract[0].state === "SUCCESS") {
					var imgData = Buffer.from(extracted[1].files[0].extract[1]);
					fileExt = path.extname(thumbnailFileName[0]);

					//Generate thumbnail data
					imgData = (
						await sharp(imgData)
							.resize(100, 150)
							.webp({
								quality: 60
							})
							.toBuffer()
					).toString("base64");

					//Return thumbnail data back to renderer
					process.send({
						thumbnailData: imgData,
						thumbnailExt: fileExt,
						file: file
					});
				}
			}
		}
	}
});

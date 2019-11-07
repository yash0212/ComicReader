const path = require("path");
const fs = require("fs");
const unzipper = require("unzipper");
const unrar = require("electron-unrar-js");
const btoa = require("btoa");
const Uint8ToString = require("./Uint8ToString.js");
process.on("message", file => {
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
				let obj;
				if (!imgFound && type == "File" && fileName.endsWith(".jpg")) {
					imgFound = 1;
					obj = await entry.buffer();
					imgData = obj.toString("base64");
					process.send({
						imgData: imgData,
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
					if (!found && path.extname(x.name) == ".jpg") {
						found = 1;
						return true;
					}
				})
				.map(x => x.name);

			var extracted = extractor.extractFiles([thumbnailFileName]);

			if (extracted[0].state === "SUCCESS") {
				if (extracted[1].files[0].extract[0].state === "SUCCESS") {
					var imgData = extracted[1].files[0].extract[1];
					imgData = Uint8ToString(imgData);

					process.send({
						imgData: imgData,
						file: file
					});
				}
			}
		}
	}
});
// function Uint8ToString(u8a) {
// 	var CHUNK_SZ = 0x8000;
// 	var c = [];
// 	for (var i = 0; i < u8a.length; i += CHUNK_SZ) {
// 		c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
// 	}
// 	return btoa(c.join(""));
// }
// async function fileThumbnail(file) {
// 	return new Promise((res, rej) => {
// 		console.log(file.name);
// 		if (
// 			path.extname(file.path) === ".cbz" ||
// 			path.extname(file.path) === ".zip"
// 		) {
// 			let imgFound = 0;
// 			fs.createReadStream(file.path)
// 				.pipe(unzipper.Parse())
// 				.on("entry", async function(entry) {
// 					const fileName = entry.path;
// 					const type = entry.type; // 'Directory' or 'File'
// 					const size = entry.vars.uncompressedSize; // There is also compressedSize;
// 					let obj;
// 					if (
// 						!imgFound &&
// 						type == "File" &&
// 						fileName.endsWith(".jpg")
// 					) {
// 						imgFound = 1;
// 						obj = await entry.buffer();
// 						imgData = obj.toString("base64");
// 						// document.getElementById("test").src =
// 						// 	"data:image/jpeg;base64, " +
// 						// 	obj.toString("base64");
// 						res({
// 							imgData: imgData,
// 							file: file
// 						});
// 						// var dirEl = document.getElementById("directory");
// 						// dirEl.innerHTML = dirEl.innerHTML.concat(
// 						// 	`
// 						// 		<div class="tile">
// 						// 			<img src="data:image/jpeg;base64, ${imgData}" class="comicThumbnail"/>
// 						// 			<div>${file.name}</div>
// 						// 		</div>
// 						// 	`
// 						// );
// 					} else {
// 						entry.autodrain();
// 					}
// 				});
// 		} else if (
// 			path.extname(file.path) === ".cbr" ||
// 			path.extname(file.path) === ".rar"
// 		) {
// 			// Read the archive file into a typedArray
// 			var buf = Uint8Array.from(fs.readFileSync(file.path)).buffer;
// 			var extractor = unrar.createExtractorFromData(buf);

// 			var fileList = extractor.getFileList();
// 			if (fileList[0].state === "SUCCESS") {
// 				let found = 0;
// 				var thumbnailFileName = fileList[1].fileHeaders
// 					.sort((a, b) =>
// 						a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 0
// 					)
// 					.filter(x => {
// 						if (!found && path.extname(x.name) == ".jpg") {
// 							found = 1;
// 							return true;
// 						}
// 					})
// 					.map(x => x.name);

// 				var extracted = extractor.extractFiles([thumbnailFileName]);

// 				if (extracted[0].state === "SUCCESS") {
// 					if (extracted[1].files[0].extract[0].state === "SUCCESS") {
// 						imgData = extracted[1].files[0].extract[1];
// 						var dirEl = document.getElementById("directory");
// 						imgData = Uint8ToString(imgData);
// 						res({
// 							imgData: imgData,
// 							file: file
// 						});
// 					}
// 				}
// 			}
// 		}
// 	});
// }

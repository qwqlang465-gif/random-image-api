import multer from 'multer';
import { config } from '../config.js';

export const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSizeMb * 1024 * 1024,
    files: config.maxUploadFiles
  }
}).array('images', config.maxUploadFiles);

export function runUpload(req, res, next) {
  uploadImages(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).send(`单文件大小不能超过 ${config.maxFileSizeMb}MB`);
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).send(`每次最多上传 ${config.maxUploadFiles} 张图片`);
    }
    return res.status(400).send(error.message || '上传失败');
  });
}

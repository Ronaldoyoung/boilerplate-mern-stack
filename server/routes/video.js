const express = require('express');
const router = express.Router();
// const { Video } = require("../models/Video");

const { auth } = require("../middleware/auth");
const multer = require('multer');
var ffmpeg = require('fluent-ffmpeg');

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    if(ext !== '.mp4') {
      return cb(res.status(400).end('only jpg, png, mp4 is allowed') , false);
    }
    cb(null, true);
  }
})

const upload = multer( {storage: storage }).single('file'); //파일은 single 하나만 할 수 있도록 함.

//=================================
//             Video
//=================================

router.post('/uploadfiles', (req, res) => {

  //비디오를 서버에 저장한다.
  upload(req, res, err => {
    if(err) {
      return res.json({ success: false, err })
    }
    return res.json({ success: true, url: res.req.file.path, fileName: res.req.file.filename })
  })

})

router.post('/thumbnail', (req, res) => {

  let filePAth = '';
  let fileDuration = '';

  //비디오 정보 가져오기
  ffmpeg.ffprobe(req.body.url, function(err, metadata) {
    console.dir(metadata);
    console.log(metadata.format.duration);
    fileDuration = metadata.format.duration
  })

  // 썸네일 생성 하고 비디오 러닝타임도 가져오기
  ffmpeg(req.body.url) //클라이언트에서 온 비디오 저장 경로
    .on('filenames', function (filenames) { //비디오 썸네일 파일 네임 생성
      console.log('Will generate ' + filenames.join(', '))
      console.log(filenames);

      filePath = 'uploads/thumbnails/' + filenames[0]
    }) //썸네일이 다 생성되고 무엇을 할지
    .on('end', function () {
      console.log('Screenshots taken');
      return res.json({ success:true, url: filePath, fileDuration: fileDuration });
    })
    .on('error', function (err) { //에러가 날 경우
      console.error(err);
      return res.json({ success: false, err });
    })
    .screenshots({ //옵션
      count: 3, //3개의 썸네일 생성
      folder: 'uploads/thumbnails', //
      size: '320x240',
      filename: 'thumbnail-%b.png'
    })

})

module.exports = router;

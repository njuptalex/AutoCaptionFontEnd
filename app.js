var express = require("express");
var connect = require("connect");
var http = require("http");
var fs = require("fs");
var path = require("path");
var cors = require("cors");
var bodyParser = require("body-parser");
var multer = require("multer");
var app = express();
// parse application/x-www-form-urlencoded
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(cors());
// parse application/json
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(express.static("upload"));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});
app.use(bodyParser.json({ "limit":"1000m"}));

app.all("*", function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", " 3.2.1");
  res.header("Content-Type", "application/json;charset=utf-8");
  next();
});

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

var createFolder = function(folder) {
  try {
    fs.accessSync(folder);
  } catch (e) {
    fs.mkdirSync(folder);
  }
};

var uploadFolder = "./upload/";
var downloadFolder = "./download";

createFolder(uploadFolder);
createFolder(downloadFolder);

// 通过 filename 属性定制
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadFolder); // 保存的路径，备注：需要自己创建
  },
  filename: function(req, file, cb) {
    // 将保存文件名设置为 字段名 + 时间戳，比如 logo-1478521468943
    cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname);
  }
});

// 通过 storage 选项来对 上传行为 进行定制化
var upload = multer({
  storage: storage
});

app.post("/file-upload", upload.single("video"), function(req, res, next) {
  var file = req.file;
  console.log("文件类型：%s", file.mimetype);
  console.log("原始文件名：%s", file.originalname);
  console.log("文件大小：%s", file.size);
  console.log("文件保存路径：%s", file.path);
  var obj = {};
  obj.path = file.path;
  obj.size = file.size;
  obj.type = file.mimetype;
  console.log(obj);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.end(JSON.stringify(obj));
});

app.get("/srt-download", function(req, res, next) {
  console.log(req.query);
  var currDir = path.normalize(req.query.dir),
    fileName = req.query.name,
    currFile = path.join(currDir, fileName),
    fReadStream;
  console.log(currDir);
  console.log(fileName);
  console.log("---------访问下载路径-------------");
  fs.exists(currFile, function(exist) {
    if (exist) {
      console.log("文件存在");
      res.set({
        "Content-type": "application/octet-stream",
        "Content-Disposition": "attachment;filename=" + encodeURI(fileName)
      });
      console.log("读取文件完毕，正在发送......");
      fReadStream = fs.createReadStream(currFile);
      fReadStream.on("data", chunk => res.write(chunk, "binary"));
      fReadStream.on("end", function() {
        console.log("文件发送完毕");
        res.end();
      });
    } else {
      res.set("Content-type", "text/html");
      res.send("file not exist!");
      res.end();
    }
  });
});
var server = app.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);
});

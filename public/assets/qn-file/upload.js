/**
 * Created by zhwei on 15/10/28.
 */

// 存放当前页面中所有的uploader实例
var uploaderList = [];

// 存放当前页面中所有的上传文件数据, {'images': {'户型图': [...], ...}, ... }
var fileList = {};
var fileLinks = {};

$('.qn-upload-links').each(function () {
	var text = $(this).text().trim();
	if (text) {
		$.each(JSON.parse(text), function ($name, $value) {
			fileLinks[$name] = $value;
		});
	}
});

jQuery.fn.qnUploader = function (opts) {
	var up = new Uploader($(this), opts);
	up.render();
	uploaderList.push(up);
};

var PREFIX_UPLOADER_BLOCK = 'qn-upload-block-';
var PREFIX_UPLOADER_PICKER = 'qn-upload-picker-';


function Uploader($trigger, opts) {
	// 上层的的div
	this.group = $trigger.closest('.qn-upload');

	this.browseBtnId = PREFIX_UPLOADER_PICKER + opts.name;
	this.containerId = PREFIX_UPLOADER_BLOCK + opts.name;

	// 创建 or 拿到填充数据的input
	this.input = this.group.siblings('[name=' + opts.inputName + ']');
	if (this.input.length == 0) {
		this.input = this.group.closest('form').find('[name=' + opts.inputName + ']')
	}

	// 准备fileList里的存放位置
	if ($.isEmptyObject(fileList[opts.inputName])) {
		fileList[opts.inputName] = {};
	}

	// 方便调用
	var that = this;

	// 写入fileList的函数
	this.pushFileKey = function (key) {
		if ($.isEmptyObject(fileList[opts.inputName][opts.name])) {
			fileList[opts.inputName][opts.name] = [];
		}
		if (fileList[opts.inputName][opts.name].indexOf(key) == -1) {
			fileList[opts.inputName][opts.name].push(key);
		}
	};

	this.isModify = function () {
		return ['modify', 'create'].indexOf(opts.status) > -1;
	};

	// 生成上传控件
	this.render = function () {
		this.group.before($('<div/>', {
			'id': this.containerId,
			'class': 'panel panel-default',
			'style': 'margin-top: 15px;',
			'html': [
				$('<div/>', {
					'class': 'panel-heading',
					'html': [
						'<span style="margin-right: 1em;">' + (opts.required ? '* ' : '') + opts.name + '</span>',
						that.isModify() ? $('<span/>', {
							'id': that.browseBtnId,
							'class': 'btn btn-primary btn-sm',
							'html': '添加' + opts.typeTitle + '（可多选）'
						}) : $('<span />', {
							'class': 'btn btn-success btn-sm qn-preview',
							'html': '大图预览'
						})
					]
				}),
				$('<div/>', {'class': 'panel-body'})
			]
		}));

		var $container = $('#' + this.containerId);
		this.previewer = $container.find('.panel-body');
		this.initQiNiuUploader();

		var val = this.getValue();
		if (!$.isEmptyObject(val) && $.isPlainObject(val)) {
			fileList[opts.inputName] = val;
		}

		this.showUploadFiles();

		if (this.isModify() && opts.required) {
			this.bindRequired();
		}

		if (!that.isModify()) {
			$container.find('.qn-preview').on('click', function () {
				var images = '';
				var files = fileList[opts.inputName][opts.name];
				$.each($.isEmptyObject(files) ? [] : files, function (idx, key) {
					images += '<hr>';
					images += '<a href="' + fileLinks[key].url
						+ '"><img src="' + fileLinks[key].url + '" style="max-width: 100%"></a>';
				});

				var page = '<html><head><title>' + opts.name + ' 大图预览</title></head>'
					+ '<body style="width: 100%; max-width: 100%; text-align: center;"><h1>'
					+ opts.name + '</h1>'
					+ images + '</body></html>';

				var myWindow = window.open('', '大图预览', 'width=100%,resizable=1');
				myWindow.document.write(page)
			});
		}
	};

	this.getValue = function () {
		var str = $.trim(this.isModify() ? this.input.val() : this.input.text());
		return str ? JSON.parse(str) : null;
	};

	// 填充form
	this.fillForm = function () {
		this.input.val(JSON.stringify(fileList[opts.inputName]));
	};

	this.imagePreview = function (file) {
		var $img = $('<img/>', {
			'id': file.id,
			'class': 'img-thumbnail',
			'alt': file.name + ' 上传中'
		});

		//@todo 这部分还有bug，一个页面上有个多个控件的时候有的缩略图不显示。
		if (file.size < 2000000) { //如果文件过大，手机压缩时间会很长。
			//缩略图 From http://bennadel.github.io/Plupload-Image-Preview/
			var preloader = new mOxie.Image();
			preloader.onload = function () {
				preloader.downsize(100, 100);
				var imgUrl = preloader.getAsDataURL();
				$img.prop("src", imgUrl);
				$img.after('<br>');
			};
			preloader.load(file.getSource());
		} else {
			$img.prop("alt", "上传中。文件太大，无缩略图。");
		}

		return $img
	};

	// 已经存在的文件的预览
	this.showUploadFiles = function () {
		var files = fileList[opts.inputName][opts.name];
		$.each(files ? files : [], function (idx, key) {
			var $div = $('<div/>', {
				'class': 'file-block img-thumbnail text-center',
				'style': 'margin-right: 10px;',
				'data-key': key,
				'html': that.isModify() ? '<span class="btn btn-xs btn-danger btn-block file-delete">删除</span>' : ''
			});
			that.previewer.append($div);

			if (opts.type == 'image') {
				$div.prepend('<p><a href="' + fileLinks[key].url + '" target="_blank"><img class="img-thumbnail" src="' + fileLinks[key].small + '"></a></p>');
			} else {
				$div.prepend('<p><a href="' + fileLinks[key].url + '" target="_blank">' + fileLinks[key].title + '</a></p>');
			}
		});
		this.bindDelete();
	};

	this.previewFile = function (file) {
		var $div = $('<div/>', {
			'id': 'block-' + file.id,
			'class': 'file-block img-thumbnail text-center',
			'style': 'margin-right: 10px;',
			'html': '<span class="btn btn-xs btn-warning btn-block file-delete">上传中</span>'
		});

		if (opts.type == 'image') {
			$div.prepend(this.imagePreview(file));
		} else {
			$div.prepend('<small>' + file.name + '</small>');
		}

		this.previewer.append($div);
		this.bindDelete();
	};

	this.bindRequired = function () {
		this.group.closest('form').submit(function (event) {
			if ($.isEmptyObject(fileList[opts.inputName][opts.name])
				|| fileList[opts.inputName][opts.name].length == 0) {
				event.preventDefault();
				alert(opts.name + '不能为空');
			}
		})
	};

	// 删除按钮的监听事件
	this.bindDelete = function () {
		this.previewer.find('.file-delete').on('click', function () {
			var $block = $(this).closest('.file-block');
			var key = $block.data('key');
			if (key != undefined) {
				var idx = fileList[opts.inputName][opts.name].indexOf(key);
				if (idx > -1) {
					fileList[opts.inputName][opts.name].splice(idx, 1)
				}
			}
			$block.fadeOut('fast');
			that.fillForm();
		});
	};

	this.removeFile = function (file) {
		if ($.isEmptyObject(fileList[opts.inputName][opts.name])) {
			fileList[opts.inputName][opts.name] = [];
		} else {
			var idx = fileList[opts.inputName][opts.name].indexOf(file.id);
			if (idx > -1) {
				fileList[opts.inputName][opts.name].splice(idx, 1)
			}
		}

		$('#block-' + file.id).remove();
		that.fillForm();
		this.uploader.removeFile(file);
	};

	this.isNeedCompress = function (file) {
		return !$.isEmptyObject(opts.compress) && opts.type == 'image' && file.name.indexOf('has-compress.') == -1
	};

	// 初始化七牛的 uploader & 真正的上传过程
	this.initQiNiuUploader = function () {
		var qn = new QiniuJsSDK();
		this.uploader = qn.uploader({
			container: that.containerId,        //上传区域DOM ID，默认是browser_button的父元素，
			browse_button: that.browseBtnId,       //上传选择的点选按钮，**必需**
			multi_selection: true, //note: 支持多选的时候，会导致无法使用摄像头直接拍.
			runtimes: 'html5,flash,html4',    //上传模式,依次退化
			filters: {
				mime_types: [{
					title: opts.typeTitle,
					extensions: opts.ext
				}]
			},
			uptoken_url: opts.upUrl,            //Ajax请求upToken的Url，**强烈建议设置**（服务端提供）
			downtoken_url: opts.downUrl,
			save_key: true,   // 默认 false。若在服务端生成uptoken的上传策略中指定了 `sava_key`，则开启，SDK在前端将不对key进行任何处理
			domain: 'http://',   //bucket 域名，下载资源时用到，**有downtoken_url，这个就不需要了。**
			max_file_size: '100mb',   //最大文件体积限制
			chunk_size: '4mb',  //分块上传时，每片的体积 (这个值如果大于4M，会被qiniu js sdk reset)
			flash_swf_url: './Moxie.swf',  //引入flash,相对路径
			max_retries: 3,      //上传失败最大重试次数
			dragdrop: false,     //开启可拖曳上传
			auto_start: true,                 //选择文件后自动上传，若关闭需要自己绑定事件触发上传,
			canSendBinary: true,
			init: {
				'FilesAdded': function (up, files) {
					var needCompress = [];
					plupload.each(files, function (file) {
						if (that.isNeedCompress(file)) {
							that.previewer.append($('<span />', {
								id: 'compressing-' + file.id,
								html: '图片压缩中...',
								'class': 'badge badge-info'
							}));

							needCompress.push(file);
						} else {
							that.previewFile(file);
						}
					});

					if (needCompress.length > 0) {
						needCompress.reverse();
						that.resizeFileInQueue(up, needCompress);
					}
				},
				'UploadProgress': function (up, file) {
					var $imgBtn = $('#block-' + file.id).find('.btn');
					if ($imgBtn.length != 0) {
						if (file.percent == 100) {
							$imgBtn.removeClass('btn-warning');
							$imgBtn.addClass('btn-danger');
							$imgBtn.text('上传完成');
							setTimeout(function () {
								$imgBtn.text('删除');
							}, 1000);
						} else {
							$imgBtn.text(file.percent + '%');
						}
					}
				},
				'FileUploaded': function (up, file, info) {
					// 每个文件上传成功后,处理相关的事情
					// 其中 info 是文件上传成功后，服务端返回的json，形式如
					// {
					//    "hash": "Fh8xVqod2MQ1mocfI4S4KpRL6D98",
					//    "key": "nnnnn.png",
					//    "url":"http://xx.glb.qiniucdn.com/nnnnnn.png?e=xxx"
					//  }
					// 参考http://developer.qiniu.com/docs/v6/api/overview/up/response/simple-response.html
					var $block = $('#block-' + file.id);
					var _info = $.parseJSON(info);
					$block.data('key', _info.key);
					var url = (opts.mode == 'private') ? _info.url : 'http://' + opts.domain + '/' + _info.key + '?imageView2/1/w/100/h/100';
					$block.find('img').prop('src', url);
					that.pushFileKey(_info.key);
					that.fillForm();
				},
				'Error': function (up, err, errTip) {
					//上传出错时,处理相关的事情
					var $block = $('#block-' + err.file.id);
					$block.prepend('<p style="color: red;"><small>文件上传失败<br>' + errTip + '</small></p>');
				},
				'UploadComplete': function () {
					//队列文件处理完毕后,处理相关的事情
				}
			}
		});
	};

	this.resizeFileInQueue = function (up, files) {
		if ($.isEmptyObject(files)) {
			that.previewer.find('p.text-danger').remove();
			return null;
		} else {
			var file = files.pop();

			canvasResize(file.getNative(), {
				width: opts.compress.width,
				height: opts.compress.height,
				crop: opts.compress.crop,
				quality: opts.compress.quality,
				callback: function (blob) {
					$('#compressing-' + file.id).fadeOut('fast').remove();
					up.addFile(new o.Blob(null, blob), 'has-compress.' + file.name);

					that.removeFile(file);
					that.resizeFileInQueue(up, files);
				}
			});
		}
	};
}
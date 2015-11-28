## Fork from https://github.com/zofe/rapyd-laravel

## the ‘dev’ branch is newest code, master branch keeps the same as upstream.

## dev branch only tested under Laravel 5.1.

## added features:

1. fix security issue on 'readonly' mode

2. add Datagrid::buildExcel() function （add maatwebsite/excel by composer）

3. Date组件默认的format改成'Y-m-d', lang改为'zh-CN'，方便兼容HTML5自带的日期组件。

4. 添加QNFile Field，七牛的文件上传控件
```php

$edit->addQNFile('images', '')->fileType('image')
    ->part('现场实拍')
    ->part('附加图片', true) // 第二个参数为true时，当前必填
    ...
;

$edit->addQNFile('documents', '')->fileType('documents')
    ->part('附件')
    ...
;

// 如果多个图片上传空间在表单的不同位置，如下，这种情况下的是否必填根据rule来判定

$edit->addQNFile('images:其他证明1', '')->fileType('image')->required(); // 必填
$edit->addText('image_note_1', '其他证明1（说明）:');

$edit->addQNFile('images:其他证明2', '')->fileType('image');
$edit->addText('image_note_2', '其他证明2（说明）:');

$edit->addQNFile('images:其他证明3', '')->fileType('image');
$edit->addText('image_note_3', '其他证明3（说明）:');
```
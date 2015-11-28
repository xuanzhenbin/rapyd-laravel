<?php namespace Zofe\Rapyd\DataForm\Field;

use Barryvdh\Debugbar\JavascriptRenderer;
use Zofe\Rapyd\Helpers\HTML;
use Zofe\Rapyd\Rapyd;
use Illuminate\Html\FormFacade as Form;

class QNFile extends Field
{
    const TYPE_IMAGE = 'image';
    const TYPE_DOCUMENT = 'document';
    const MODE_PRIVATE = 'private';
    const MODE_PUBLIC = 'public';

    private $parts = [];
    public $type = "text";
    private $saveTo = null;
    private $fileType = self::TYPE_IMAGE;
    private $fileMode = self::MODE_PRIVATE;

    // 为了支持同一个页面多个上传控件，就这样搞了
    private static $isFirst = [];

    protected function setName($name)
    {
        parent::setName($name);
        if (str_contains($name, ':')) {
            $this->saveTo = explode(':', $name)[0];
        }
    }

    public function part($name, $isRequred = false)
    {
        $this->parts [$name] = ['required' => $isRequred];

        return $this;
    }

    public function fileType($type)
    {
        $this->fileType = $type;

        return $this;
    }

    public function fileMode($mode = self::MODE_PRIVATE)
    {
        $this->fileMode = $mode;

        return $this;
    }

    public function saveTo($dbName)
    {
        $this->saveTo = $dbName;

        return $this;
    }

    private function isFirst()
    {
        if (isset(self::$isFirst[$this->db_name])) {
            return false;
        } else {
            self::$isFirst[$this->db_name] = true;
            return true;
        }
    }

    public function build()
    {
        $output = '<div class="clearfix"></div>';
        Rapyd::js('qn-file/plupload.full.min.js');
        Rapyd::js('qn-file/qiniu.js');
        Rapyd::js('qn-file/upload.js');

        if (!$this->label) {
            $this->label = ($this->status != 'show') ? ' ' : '';
        }

        if (parent::build() === false) {
            return;
        }

        $attrs = [
            'class' => 'qn-upload',
            'data-type' => $this->fileType,
            'data-required' => $this->required ?: '',
            'data-status' => $this->status,
        ];

        $this->attributes = array_merge($this->attributes, $attrs);

        // input
        switch ($this->status) {
            case "disabled":
            case "show":
                $output .= "<span name=\"{$this->db_name}\" class=\"hide\">{$this->value}</span>";
                break;

            case "create":
            case "modify":
                $output .= Form::hidden($this->db_name, $this->value);
                break;

            case "hidden":
                $output = Form::hidden($this->db_name, $this->value);
                break;
            default:
                ;
        }

        $saveTo = $this->saveTo ?: $this->db_name;

        // 需要上传的项目
        $parts = '';
        foreach ($this->parts as $part => $partAttr) {

            // 初始化上传组件
            $options = json_encode([
                'name' => $part,
                'type' => $this->fileType,
                'typeTitle' => config("rapyd.qn-file.{$this->fileType}.title"),
                'ext' => config("rapyd.qn-file.{$this->fileType}.ext"),
                'required' => array_get($partAttr, 'required'),
                'status' => $this->status,
                'inputName' => $saveTo,
                'mode' => $this->fileMode,
                'domain' => config("services.qiniu.bucket.{$this->fileMode}.domain"),
                'upUrl' => route('rapyd.qn.up-token') . "/{$this->fileType}/{$this->fileMode}",
                'downUrl' => config("rapyd.qn-file.{$this->fileType}.down-url")
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            $parts .= <<<HTML
                <span class="qn-upload-part" data-name="{$part}"></span>
                <script>
                $(document).ready(function () {
                    $('.qn-upload-part[data-name={$part}]').qnUploader({$options});
                })
                </script>
HTML;
        }

        // 为当前字段中所有的文件生成链接
        $fileLinks = [];
        $store = config("rapyd.qn-file.{$this->fileType}.store");
        foreach (json_decode($this->value ?: '{}', true) as $name => $value) {
            $value = (isset($value) && is_array($value)) ? $value : [];
            foreach ($value as $key) {
                $fileLinks[$key] = ['url' => $store->url($key)];

                switch ($this->fileType) {
                    case self::TYPE_IMAGE:
                        $fileLinks[$key]['small'] = $store->size(100, 100)->url($key);
                        break;
                    case self::TYPE_DOCUMENT:
                        $fileLinks[$key]['title'] = $store->title($key);
                        break;
                }
            }
        }
        $fileLinks = json_encode($fileLinks, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $output .= <<<HTML
        <div class="qn-upload hide" data-name="{$saveTo}">
            {$parts}
            <span class="qn-upload-links">{$fileLinks}</span>
        </div>
HTML;
        $this->output = "\n" . $output . "\n" . $this->extra_output . "\n";
    }
}

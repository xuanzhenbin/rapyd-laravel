<? $checkbox_config = $dg->getCheckboxConfig() ?>
@if ($checkbox_config)
    <a class="btn btn-primary" id="{{ $checkbox_config['key'] }}">全选 / 反选</a>
    @foreach($checkbox_config['actions'] as $_name => $_url)
        <a target="_blank" class="checkbox_action btn btn-default" onclick="return get_checked_ids('{{$checkbox_config['key']}}', this);" href="{{$_url}}">{{$_name}}</a>
    @endforeach

    <script>
        //全选/反选 按钮
        $('#{{$checkbox_config['key']}}').click(function () {
            var checkBoxes = $(':checkbox[name="' + this.id + '"]');
            checkBoxes.prop("checked", !checkBoxes.prop("checked"));
        })

        //整行可点选Checkbox功能
        $(document).ready(function () {
            $("tr").click(function (e) {
                if (e.target.type != 'checkbox' && e.target.tagName != 'A') {
                    var cb = $(this).find("input[type=checkbox]");
                    cb.trigger('click');
                }
            });
        });

        //返回所有选中的ID,这里支持一个页面上有多个不同的DG组件,
        var get_checked_ids = function (key, btn) {
            var ids = $(':checkbox:checked[name="' + key + '"]').map(function () {
                return $(this).val();
            }).get().sort();

            if (ids.length == 0) {
                alert("!! 尚未选中任何记录 !!");
                return false;
            }

            var connect = (btn.href.indexOf('?') == -1) ? '?' : '&';
            btn.href = btn.href + connect + 'ids[]=' + ids.join("&ids[]=");
            window.open(btn.href, "", "toolbar=false, scrollbars=yes, resizable=yes, top=400, left=400, width=500, height=500");
            return false;//禁止a的默认行为
        }
    </script>
@endif
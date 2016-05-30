<?php

namespace Zofe\Rapyd\DataForm\Field;

use Collective\Html\FormFacade as Form;
use Zofe\Rapyd\Rapyd;

// Mapping to HTML5 Input type
// http://www.w3.org/TR/html-markup/input.number.html
class Number extends Field
{
    public $type = "number";
    public $clause = "where";
    public $rule = ["numeric"];

    private function addLimitsToAttributes()
    {
        $max = null;
        $min = null;
        foreach ($this->rule as $rule) {
            switch (true) {
                case preg_match('/^between:(-?\d+),(-?\d+)$/', $rule, $match):
                    if ($match[1] || $match[1] == 0) {
                        list($min, $max) = array_slice($match, -2);
                    }
                    break;

                case preg_match('/^max:(-?\d+)$/', $rule, $match):
                    $max = $match[1];
                    break;

                case preg_match('/^min:(-?\d+)$/', $rule, $match):
                    $min = $match[1];
                    break;
            }
        }

        if (!is_null($max)) {
            $this->attributes ['max'] = $max;
        }

        if (!is_null($min)) {
            $this->attributes ['min'] = $min;
        }
    }

    public function build()
    {
        $output = "";

        if (parent::build() === false) {
            return;
        }

        switch ($this->status) {
            case "disabled":
            case "show":

                if ($this->type == 'hidden' || $this->value === "") {
                    $output = "";
                } elseif ((!isset($this->value))) {
                    $output = $this->layout['null_label'];
                } else {
                    $output = $this->value;
                }
                $output = "<div class='help-block'>" . $output . "&nbsp;</div>";
                break;

            case "create":
            case "modify":
                $this->addLimitsToAttributes();
                $output = Form::number($this->name, $this->value, $this->attributes);
                break;

            case "hidden":
                $output = Form::hidden($this->name, $this->value);
                break;

            default:
        }
        $this->output = "\n" . $output . "\n" . $this->extra_output . "\n";
    }

}

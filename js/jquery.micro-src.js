/**@license
 *| _ __ ___ (_) ___ _ __ ___
 *|| '_ ` _ \| |/ __| '__/ _ \
 *|| | | | | | | (__| | | (_) |
 *||_| |_| |_|_|\___|_|  \___/
 *|               version {{V}}
 *
 * Pico/Nano like editor for jquery
 *
 * http://micro.jcubic.pl
 *
 * Licensed under GNU GPL Version 3 license
 * Copyright (c) 2013 Jakub Jankiewicz <http://jcubic.pl>
 *
 * Date: {{DATE}}
 */
(function($, undefined) {
    // -----------------------------------------------------------------------
    // :: Return string repeated n times
    // -----------------------------------------------------------------------
    function str_repeat(str, n) {
        var result = '';
        for (var i = n; i--;) {
            result += str;
        }
        return result;
    }
    // -----------------------------------------------------------------------
    // :: Main Class
    // -----------------------------------------------------------------------
    function micro(root, settings) {
        this._root = $(root);
        this._letter = this.calculate_letter_size();
        this._root.addClass('micro');
        this._root.css({
            width: settings.width,
            height: settings.height
        });
        this._title = $('<div/>').addClass('title').appendTo(this._root);
        this.set_file_name('');
        $('<div>&nbsp;</div>').addClass('spacer').appendTo(this._root);
        this._table = $('<div/>').addClass('matrix');
        this.refresh();
        this._matrix = [];
        for (var i = 0; i < this._rows; ++i) {
            var line = $('<div/>').addClass('line').appendTo(this._table);
            this._matrix[i] = [];
            for (var j = 0; j < this._cols; ++j) {
                var cell = $('<span>&nbsp;</span>').appendTo(line);
                this._matrix[i][j] = cell;
            }
        }
        this._cursor = {x:0, y:0};
        this._table.appendTo(this._root);
        this._footer = $('<div/>').addClass('footer').appendTo(this._root);
        this._message = $('<div/>').addClass('message').append('<span/>').
            appendTo(this._root).find('span');
    }
    // -----------------------------------------------------------------------
    micro.prototype = {
        refresh: function() {
            this._rows = Math.floor(this._root.height() / this._letter.height) - 4;
            this._cols = Math.floor(this._root.width() / this._letter.width);
            return this;
        },
        _view: function(offset) {
            if (this._lines) {
                var lines = this._lines.slice(offset, offset+this._rows), i;
                var cursor_y = this._cursor.y-offset;
                if (lines[cursor_y].length > this._cols && this._cursor.x > this._cols) {
                    for (i = 0; i < cursor_y; ++i) {
                    }
                    // cursor line
                    for (i = cursor_y+1; i < lines.length; ++i) {
                    }
                } else {
                    var self = this;
                    $.each(lines, function(i, line) {
                        var len = line.length > self._cols ? self._cols : line.length;
                        for (var ch=0; ch<len; ++ch) {
                            self._matrix[i][ch].html(line[ch].replace(' ', '&nbsp;'));
                        }
                    });
                }
            }
            return this;
        },
        version: function() {
            return '{{VER}}';
        },
        set_file_name: function(fname) {
            var text = '  jQuery Micro ' + this.version();
            text += str_repeat(' ', 30-text.length) + $.micro.strings.file + ': ' + fname;
            this._title.html(text.replace(/ /g, '&nbsp;'));
        },
        message: function(string) {
            this._message.text(string);
        },
        open: function(fname) {
            var self = this;
            $.get(fname, function(text) {
                self.set_file_name(fname);
                self._lines = text.split('\n');
                self._view(0);
            });
            return this;
        },
        calculate_letter_size: function() {
            var $temp = $('<div class="micro"><div><span>&nbsp;</span></div></div>').
                appendTo('body');
            var width = $temp.find('span').width();
            var height = $temp.find('div').height();
            $temp.remove();
            return {
                width: width,
                height: height
            };
        }
    };
    // -----------------------------------------------------------------------
    $.micro = {
        defaults: {
            width: '100%',
            height: '400px'
        },
        strings: {
            file: 'File'
        },
        init: micro,
        fn: micro.prototype
    };
    // -----------------------------------------------------------------------
    $.fn.micro = function(arg) {
        if (typeof arg === 'string') {
            var args = Array.prototype.slice.call(arguments);
            args.shift();
            return $.each(this, function() {
                var micro = $(this).data('micro');
                $.micro.fn[arg].apply(micro, args);
            });
        } else {
            var settings = $.extend({}, $.micro.defaults, arg);
            $.each(this, function() {
                $(this).data('micro', new $.micro.init(this, settings));
            });
        }
    };
})(jQuery);

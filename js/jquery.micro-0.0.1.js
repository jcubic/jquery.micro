/**@license
 *| _ __ ___ (_) ___ _ __ ___
 *|| '_ ` _ \| |/ __| '__/ _ \
 *|| | | | | | | (__| | | (_) |
 *||_| |_| |_|_|\___|_|  \___/
 *|               version 0.0.1
 *
 * Pico/Nano like editor for jquery
 *
 * http://micro.jcubic.pl
 *
 * Licensed under GNU GPL Version 3 license
 * Copyright (c) 2013 Jakub Jankiewicz <http://jcubic.pl>
 *
 * Date: Sun, 28 Jul 2013 18:45:22 +0000
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
        this._letter = this._calculate_letter_size();
        this._root.addClass('micro');
        this._root.css({
            width: settings.width,
            height: settings.height
        });
        this._settings = settings;
        this._title = $('<div/>').addClass('title').appendTo(this._root);
        this._set_file_name('');
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
        this._pointer = {x:0, y:0};
        this._table.appendTo(this._root);
        this._footer = $('<div/>').addClass('footer').appendTo(this._root);
        this._message = $('<div/>').addClass('message').append('<span/>').
            appendTo(this._root).find('span');
        this._lines = [''];
        this._offset = 0;
        this._page = 0;
        this._set_pointer(0, 0);
        var self = this;
        this._focus = settings.enabled;
        $(document).bind('keydown.micro', function(e) {
            if (self.focus) {
                if (e.which === 37) { // left
                    if (self._pointer.x > 0) {
                        self._set_pointer(self._pointer.x-1, self._pointer.y);
                    }
                } else if (e.which === 38) { // top
                    if (self._pointer.y > 0) {
                        self._set_pointer(self._pointer.x, self._pointer.y-1);
                    }
                } else if (e.which === 39) { // right
                    if (self._pointer.x < self._lines[self._pointer.y].length) {
                        self._set_pointer(self._pointer.x+1, self._pointer.y);
                    }
                } else if (e.which === 40) { // down
                    if (self._pointer.y < self._lines.length) {
                        self._set_pointer(self._pointer.x, self._pointer.y+1);
                    }
                } else if (e.which === 35) { //end
                    self._set_pointer(self._lines[self._pointer.y].length, self._pointer.y);
                } else if (e.which === 36) { //home
                    self._set_pointer(0, self._pointer.y);
                }
            }
        }).bind('click.micro', function(e) {
            var maybe_micro = $(e.target).parents('.micro');
            if (maybe_micro.length) {
                maybe_micro.data('micro').focus(true);
            } else {
                self.focus(false);
            }
        });
    }
    // -----------------------------------------------------------------------
    micro.prototype = {
        focus: function(toggle) {
            if (toggle === true || typeof toggle === 'undefined') {
                this._focus = true;
                this._table.find('.cursor').removeClass('inactive').css({
                    width: '',
                    height: ''
                });
            } else {
                this._focus = false;
                this._table.find('.cursor').addClass('inactive').css({
                    width: this._letter.width-2,
                    height: this._letter.height-2
                });
            }
        },
        destroy: function() {
            this._root.removeData('micro').removeClass('micro');
            this._table.remove();
            this._footer.remove();
            this._message.remove();
            $(document).unbind('.micro');
        },
        refresh: function() {
            this._rows = Math.floor(this._root.height() / this._letter.height) - 4;
            this._cols = Math.floor(this._root.width() / this._letter.width);
            return this;
        },
        text: function() {
            return this._lines.join('\n');
        },
        page: function() {
            return Math.floor((this._offset + this._settings.verticalMoveOffset) / this._rows);
        },
        _set_pointer: function(x, y) {
            if (y >= this._lines.length) {
                throw "Out of band";
            }
            this._table.find('.cursor').removeClass('cursor');
            var cursor_y;
            if (y >= this._rows) {
                var multiplier = Math.floor(y / (this._rows-1));
                var new_offset = (this._rows - this._settings.verticalMoveOffset) * multiplier;
                if (this._offset !== new_offset) {
                    this._view(new_offset);
                }
                cursor_y = (y % this._rows) + this._settings.verticalMoveOffset;
            } else {
                if (y <= this._rows - this._settings.verticalMoveOffset - 1 &&
                   this._offset !== 0) {
                    this._pointer.x = x;
                    this._pointer.y = y;
                    this._view(0);
                    cursor_y = y;
                } else if (this._offset !== 0) {
                    cursor_y = (y - this._settings.verticalMoveOffset) + 1;
                } else {
                    cursor_y = y;
                }
            }
            if (x >= this._cols-1) {
                if (x > this._lines[y].length) {
                    this._set_pointer(this._lines[y].length, y);
                } else {
                    // need to set them before because they are used by a function
                    this._pointer.x = x;
                    this._pointer.y = y;
                    this._draw_pointer_line();
                }
            } else {
                if (this._pointer.x >= this._cols-1) {
                    this._draw_line(this._pointer.y-this._offset, this._lines[this._pointer.y]);
                }
                if (x > this._lines[y].length) {
                    this._matrix[cursor_y][this._lines[y].length].addClass('cursor');
                } else {
                    this._matrix[cursor_y][x].addClass('cursor');
                }
            }
            this._pointer.x = x;
            this._pointer.y = y;
        },
        _encode: function(string) {
            return string.replace(' ', '&nbsp;').
                replace('\t', '&nbsp;&nbsp;&nbsp;&nbsp;');
        },
        _draw_line: function(n, line) {
            var len = line.length > this._cols ? this._cols : line.length, i;
            for (i = 0; i < len; ++i) {
                this._matrix[n][i].html(this._encode(line[i]));
            }
            if (line.length > this._cols) {
                this._matrix[n][this._cols-1].html('$');
            } else {
                for (i = line.length; i < this._cols; ++i) {
                    this._matrix[n][i].html('&nbsp');
                }
            }
        },
        _draw_pointer_line: function() {
            var y = this._pointer.y - this._offset;
            var line = this._lines[y];
            if (this._pointer.x >= this._cols-1) {
                if (this._pointer.x > line.length) {
                    throw "Out of bound";
                } else {
                    var multiplier = Math.floor(this._pointer.x / (this._cols-1));
                    var start = (this._cols - this._settings.horizontalMoveOffset - 1) *
                        multiplier;
                    this._draw_line(y, '$' + line.substring(start, start+this._cols));
                    var x_offset = (this._pointer.x % (this._cols-1)) +
                        this._settings.horizontalMoveOffset + 1;
                    this._matrix[y][x_offset].addClass('cursor');
                }
            }
        },
        _view: function(offset) {
            if (this._lines) {
                this._offset = offset;
                var lines = this._lines.slice(offset, offset+this._rows), i;
                var cursor_y = this._pointer.y-offset;
                if (lines[cursor_y].length > this._cols && this._pointer.x > this._cols) {
                    for (i = 0; i < cursor_y; ++i) {
                        this._draw_line(i, lines[i]);
                    }
                    // cursor line
                    for (i = cursor_y+1; i < lines.length; ++i) {
                        this._draw_line(i, lines[i]);
                    }
                } else {
                    $.each(lines, this._draw_line.bind(this));
                }
            }
            return this;
        },
        version: function() {
            return '{{VER}}';
        },
        _set_file_name: function(fname) {
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
                self._set_file_name(fname);
                self._lines = text.split('\n');
                self._view(0);
            });
            return this;
        },
        _calculate_letter_size: function() {
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
            enabled: true,
            width: '100%',
            height: '400px',
            verticalMoveOffset: 9, // when you move cursor out of editor verticaly
            horizontalMoveOffset: 6 // when you move cursor out of line
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
            if (arg[0] !== '_' && typeof $.micro.fn[arg] === 'function') {
                return $.each(this, function() {
                    var micro = $(this).data('micro');
                    $.micro.fn[arg].apply(micro, args);
                });
            } else {
                return this;
            }
        } else {
            var settings = $.extend({}, $.micro.defaults, arg);
            $.each(this, function() {
                $(this).data('micro', new $.micro.init(this, settings));
            });
        }
    };
})(jQuery);

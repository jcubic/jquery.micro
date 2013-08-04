/**@license
 *
 * jQuery Micro version {{V}}
 *
 * Pico/Nano like editor for jquery
 *
 * http://micro.jcubic.pl
 *
 * Licensed under GNU GPL Version 3 license
 * Copyright (c) 2013 Jakub Jankiewicz <http://jcubic.pl>
 *
 * Contain:
 * sprintf.js: Copyright (c) 2007-2013 Alexandru Marasteanu <hello at alexei dot ro>
 * licensed under 3 clause BSD license
 *
 * Date: {{DATE}}
 */

// Sprintf
(function(ctx) {
	var sprintf = function() {
		if (!sprintf.cache.hasOwnProperty(arguments[0])) {
			sprintf.cache[arguments[0]] = sprintf.parse(arguments[0]);
		}
		return sprintf.format.call(null, sprintf.cache[arguments[0]], arguments);
	};

	sprintf.format = function(parse_tree, argv) {
		var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
		for (i = 0; i < tree_length; i++) {
			node_type = get_type(parse_tree[i]);
			if (node_type === 'string') {
				output.push(parse_tree[i]);
			}
			else if (node_type === 'array') {
				match = parse_tree[i]; // convenience purposes only
				if (match[2]) { // keyword argument
					arg = argv[cursor];
					for (k = 0; k < match[2].length; k++) {
						if (!arg.hasOwnProperty(match[2][k])) {
							throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
						}
						arg = arg[match[2][k]];
					}
				}
				else if (match[1]) { // positional argument (explicit)
					arg = argv[match[1]];
				}
				else { // positional argument (implicit)
					arg = argv[cursor++];
				}

				if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
					throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
				}
				switch (match[8]) {
					case 'b': arg = arg.toString(2); break;
					case 'c': arg = String.fromCharCode(arg); break;
					case 'd': arg = parseInt(arg, 10); break;
					case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
					case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
					case 'o': arg = arg.toString(8); break;
					case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
					case 'u': arg = arg >>> 0; break;
					case 'x': arg = arg.toString(16); break;
					case 'X': arg = arg.toString(16).toUpperCase(); break;
				}
				arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
				pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
				pad_length = match[6] - String(arg).length;
				pad = match[6] ? str_repeat(pad_character, pad_length) : '';
				output.push(match[5] ? arg + pad : pad + arg);
			}
		}
		return output.join('');
	};

	sprintf.cache = {};

	sprintf.parse = function(fmt) {
		var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
		while (_fmt) {
			if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
				parse_tree.push(match[0]);
			}
			else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
				parse_tree.push('%');
			}
			else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
				if (match[2]) {
					arg_names |= 1;
					var field_list = [], replacement_field = match[2], field_match = [];
					if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
						field_list.push(field_match[1]);
						while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
							if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else {
								throw('[sprintf] huh?');
							}
						}
					}
					else {
						throw('[sprintf] huh?');
					}
					match[2] = field_list;
				}
				else {
					arg_names |= 2;
				}
				if (arg_names === 3) {
					throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
				}
				parse_tree.push(match);
			}
			else {
				throw('[sprintf] huh?');
			}
			_fmt = _fmt.substring(match[0].length);
		}
		return parse_tree;
	};

	var vsprintf = function(fmt, argv, _argv) {
		_argv = argv.slice(0);
		_argv.splice(0, 0, fmt);
		return sprintf.apply(null, _argv);
	};

	/**
	 * helpers
	 */
	function get_type(variable) {
		return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
	}

	function str_repeat(input, multiplier) {
		for (var output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
		return output.join('');
	}

	/**
	 * export to either browser or node.js
	 */
	ctx.sprintf = sprintf;
	ctx.vsprintf = vsprintf;
})(typeof exports != "undefined" ? exports : window);

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
        var spacer = $('<div/>').addClass('spacer').appendTo(this._root);
        this._input = $('<input/>').appendTo(spacer);
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
        var self = this;
        this._input.bind('keydown.micro', function(e) {
            if (self._focus) {
                var line = self._lines[self._pointer.y];
                if (e.which === 37) { // left
                    if (self._pointer.x > 0) {
                        self._set_pointer(self._pointer.x-1, self._pointer.y);
                    }
                    return false;
                } else if (e.which === 38) { // top
                    if (self._pointer.y > 0) {
                        self._set_pointer(self._pointer.x, self._pointer.y-1);
                    }
                    return false;
                } else if (e.which === 39) { // right
                    if (self._pointer.x < self._lines[self._pointer.y].length) {
                        self._set_pointer(self._pointer.x+1, self._pointer.y);
                    }
                    return false;
                } else if (e.which === 40) { // down
                    if (self._pointer.y < self._lines.length-1) {
                        self._set_pointer(self._pointer.x, self._pointer.y+1);
                    }
                    return false;
                } else if (e.which === 35) { //end
                    self._set_pointer(self._lines[self._pointer.y].length, self._pointer.y);
                    return false;
                } else if (e.which === 36) { //home
                    self._set_pointer(0, self._pointer.y);
                    return false;
                } else if (e.which === 8) { // backspace
                    if (self._pointer.x > 0) {
                        var x = self._pointer.x > line.length ? line.length : self._pointer.x;
                        self._lines[self._pointer.y] = line.slice(0, x-1) +
                            line.slice(x, line.length);
                        self._draw_cursor_line();
                        self._set_pointer(x-1, self._pointer.y);
                    } else {
                        var prev_line = self._lines[self._pointer.y-1];
                        self._lines = self._lines.slice(0, self._pointer.y-1).
                            concat(self._lines.slice(self._pointer.y));
                        self._lines[self._pointer.y-1] = prev_line + line;
                        self._pointer.y--;
                        self._pointer.x = prev_line.length;
                        self._set_pointer(self._pointer.x, self._pointer.y);
                        self._view(self._offset);
                    }
                } else if (e.which === 46) { // delete
                    self._lines[self._pointer.y] = line.slice(0, self._pointer.x) +
                        line.slice(self._pointer.x+1, line.length);
                    self._draw_cursor_line();
                } else if (e.which === 13) { // enter
                    var rest = line.slice(self._pointer.x);
                    self._lines[self._pointer.y] = line.slice(0, self._pointer.x);
                    self._lines = self._lines.slice(0, self._pointer.y+1).
                        concat([rest]).concat(self._lines.slice(self._pointer.y+1));
                    self._set_pointer(0, self._pointer.y+1);
                    self._view(self._offset);
                }
            }
        }).bind('keypress.micro', function(e) {
            if (!e.ctrlKey) {
                var chr = String.fromCharCode(e.which);
                self.insert(chr);
            }
            e.preventDefault();
        })
        $(document).bind('click.micro', function(e) {
            var maybe_micro = $(e.target).parents('.micro');
            if (maybe_micro.length) {
                maybe_micro.data('micro').focus(true);
            } else {
                self.focus(false);
            }
        });
        this.focus(settings.enabled);
    }
    // -----------------------------------------------------------------------
    micro.prototype = {
        insert: function(string) {
            var lines = string.split('\n');
            var line = this._lines[this._pointer.y];
            if (lines.length == 1) {
                this._lines[this._pointer.y] = line.slice(0, this._pointer.x) +
                    string + line.slice(this._pointer.x);
                console.log(this._lines[this._pointer.y]);
                this._set_pointer(this._pointer.x+string.length, this._pointer.y);
                this._draw_cursor_line();
            } else {
                
            }
        },
        focus: function(toggle) {
            if (toggle === true || typeof toggle === 'undefined') {
                this._focus = true;
                this._table.find('.cursor').removeClass('inactive').css({
                    width: '',
                    height: ''
                });
                this._input.focus();
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
            var cursor_offset = Math.floor(this._rows / 2);
            var cursor_y;
            var offset = this._offset + this._rows - cursor_offset;
            this.message('[ line ' + (y+1) + '/' + this._lines.length + ' ]');
            if (y-this._offset >= this._rows) {
                cursor_y = y - offset;
                if (this._offset !== offset) {
                    this._pointer.x = x;
                    this._pointer.y = y;
                    this._view(offset);
                }
            } else if (y-this._offset < 0) {
                var new_offset = this._offset - this._rows + cursor_offset;
                this._pointer.x = x;
                this._pointer.y = y;
                this._view(new_offset);
                cursor_y = y - new_offset;
            } else {
                cursor_y = y - offset + cursor_offset + 1;
            }
            if (x >= this._cols-1) {
                if (x > this._lines[y].length) {
                    this._set_pointer(this._lines[y].length, y);
                } else {
                    // need to set them before because they are used by a function
                    this._pointer.x = x;
                    this._pointer.y = y;
                    this._draw_cursor_line();
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
        _string_length: function(string) {
            var match = string.match(/(\t)/g);
            if (!match) {
                return string.length;
            } else {
                return string.length + (match.length * 3);
            }
        },
        _draw_line: function(n, line) {
            var len = line.length > this._cols ? this._cols : line.length, i;
            for (i = 0; i < len; ++i) {
                this._matrix[n][i].html(this._encode(line[i]));
            }
            var tabs = line.match(/(\t)/g);
            tabs = tabs ? tabs.length*3 : 0;
            if (line.length + tabs > this._cols) {
                this._matrix[n][this._cols-1-tabs].html('$');
            } else {
                for (i = line.length; i < this._cols; ++i) {
                    this._matrix[n][i].html('&nbsp');
                }
            }
        },
        _draw_cursor_line: function() {
            var y = this._pointer.y - this._offset;
            var line = this._lines[this._pointer.y];
            if (this._pointer.x >= this._cols-1) {
                if (this._pointer.x > line.length) {
                    throw "Out of bound in _draw_cursor_line";
                } else {
                    var multiplier = Math.floor(this._pointer.x / (this._cols-1));
                    var start = (this._cols - this._settings.horizontalMoveOffset - 1) *
                        multiplier;
                    this._draw_line(y, '$' + line.substring(start, start+this._cols));
                    var x_offset = (this._pointer.x % (this._cols-1)) +
                        this._settings.horizontalMoveOffset + 1;
                    this._matrix[y][x_offset].addClass('cursor');
                }
            } else {
                this._draw_line(this._pointer.y, line);
            }
        },
        _view: function(offset) {
            if (this._lines) {
                this._offset = offset;
                var lines = this._lines.slice(offset, offset+this._rows), i;
                var cursor_y = this._pointer.y-offset;
                if (lines[cursor_y].length > this._cols && this._pointer.x > this._cols) {
                    console.log('_view -> x');
                    for (i = 0; i < cursor_y; ++i) {
                        this._draw_line(i, lines[i]);
                    }
                    this._draw_cursor_line();
                    for (i = cursor_y+1; i < lines.length; ++i) {
                        this._draw_line(i, lines[i]);
                    }
                } else {
                    $.each(lines, this._draw_line.bind(this));
                }
                if (lines.length < this._rows) {
                    for (i = lines.length; i<this._rows; ++i) {
                        this._draw_line(i, '');
                    }
                }
            }
            return this;
        },
        version: function() {
            return '{{V}}';
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
                self._set_pointer(0, 0);
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
        // strings use by editor, can be translated
        strings: {
            file: 'File',
            read: 'Read %s Lines',
            chr: 'line %d/%d (%d%%), col %d/%d (%d%%), char %d/%d (%d%%)'
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

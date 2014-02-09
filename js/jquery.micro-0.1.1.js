/**@license
 *
 * jQuery Micro version 0.1.1
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
 * Date: Sun, 09 Feb 2014 15:45:52 +0000
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
    var FOOTER_DEFAULT = 1;
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
        this._spacer = $('<div/>').addClass('spacer').appendTo(this._root);
        this._input = $('<input/>').appendTo(this._spacer);
        this._clipboard = $('<textarea/>').addClass('clipboard').appendTo(this._spacer);
        this._table = $('<div/>').addClass('matrix');
        this.refresh();
        this._pointer = {x:0, y:0};
        this._table.appendTo(this._root);
        this._footer = $('<div/>').addClass('footer').appendTo(this._root);
        this._footer_line_1 = $('<div/>').addClass('line1').appendTo(this._footer);
        this._footer_line_2 = $('<div/>').addClass('line2').appendTo(this._footer);
        this._message = $('<div/>').addClass('message').append('<span/>').
            appendTo(this._root).find('span');
        this._lines = [''];
        this._offset = 0;
        this._page = 0;
        this._cursor_offset = 0; // when editing longer lines
        var self = this;
        this._print_footer_keys(FOOTER_DEFAULT);
        this._input.bind('keydown.micro', function(e) {
            if (self._focus) {
                var line = self._lines[self._pointer.y];
                var tabs = self._tabs_count(line);
                if (e.which === 37) { // LEFT
                    if (self._pointer.x > 0) {
                        self._set_pointer(self._pointer.x-1, self._pointer.y);
                    }
                    e.preventDefault();
                } else if (e.which === 39) { // RIGHT
                    if (self._pointer.x < line.length) {
                        self._set_pointer(self._pointer.x+1, self._pointer.y);
                    }
                    e.preventDefault();
                } else if (e.which === 38) { // UP
                    if (self._pointer.y > 0) {
                        self._set_pointer(self._pointer.x, self._pointer.y-1);
                    }
                    e.preventDefault();
                } else if (e.which === 40) { // DOWN
                    if (self._pointer.y < self._lines.length-1) {
                        self._set_pointer(self._pointer.x, self._pointer.y+1);
                    }
                    e.preventDefault();
                } else if (e.which === 35) { // END
                    self._set_pointer(line.length, self._pointer.y);
                    e.preventDefault();
                } else if (e.which === 36) { // HOME
                    self._set_pointer(0, self._pointer.y);
                    e.preventDefault();
                } else if (e.which === 8) { // backspace
                    if (self._pointer.x === 0) {
                        if (self._pointer.y > 0) {
                            var x = self._lines[self._pointer.y-1].length;
                            self._lines[self._pointer.y-1] += self._lines[self._pointer.y];
                            self._lines = self._lines.slice(0, self._pointer.y).
                                concat(self._lines.slice(self._pointer.y+1));
                            self._set_pointer(x, self._pointer.y-1);
                            self._view(self._offset);
                        }
                    } else if (self._pointer.x > 0) {
                        var x = self._pointer.x > line.length ? line.length-tabs : self._pointer.x;
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
                    if (line.length === self._pointer.x) {
                        if (self._lines.length > self._pointer.y+1) {
                            self._lines[self._pointer.y] += self._lines[self._pointer.y+1];
                            self._lines = self._lines.slice(0, self._pointer.y+1).
                                concat(self._lines.slice(self._pointer.y+2));
                            self._view(self._offset);
                        }
                    } else {
                        self._lines[self._pointer.y] = line.slice(0, self._pointer.x) +
                            line.slice(self._pointer.x+1, line.length);
                        self._draw_cursor_line();
                    }
                } else if (e.which === 13) { // enter
                    var rest = line.slice(self._pointer.x);
                    self._lines[self._pointer.y] = line.slice(0, self._pointer.x);
                    self._lines = self._lines.slice(0, self._pointer.y+1).
                        concat([rest]).concat(self._lines.slice(self._pointer.y+1));
                    self._set_pointer(0, self._pointer.y+1);
                    self._view(self._offset);
                }
                if (e.ctrlKey) {
                    if (e.which === 86) { // CTRL+V
                        self._clipboard.val('').focus();
                        setTimeout(function() {
                            self.insert(self._clipboard.val())
                            self._clipboard.val('');
                            self._input.focus();
                        }, 100);
                    } else if (e.which === 79) { // CTRL+O
                        if (typeof self._settings.save === 'function') {
                            self._settings.save.apply(self._root);
                        } else {
                            self.message('[ ' + $.micro.strings.no_save + ' ]');
                        }
                        e.preventDefault();
                    }
                }
                if (!self._settings.cursorPosition) {
                    if (e.ctrlKey && e.which === 67) { // CTRL+C
                        self._print_cur_position();
                    } else {
                        self.message('');
                    }
                }
                //console.log('pointer [' + self._pointer.x + ' ' + self._pointer.y + ']');
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
                maybe_micro.data('micro').focus();
            } else {
                self.blur();
            }
        });
        this._table.on('click', 'span', function() {
            var $this = $(this);
            var y = self._offset + $this.parents('.line').index();
            var old_x = self._pointer.x;
            var old_y = self._pointer.y;
            var x = $this.index();
            var line = self._lines[self._pointer.y];
            var start = self._get_cursor_offset();
            if (start > 0 && self._pointer.y == y) {
                // click on the same line when editing longer line
                var tabs = self._tabs_count(line);
                var file_x = start+x-1-tabs;
                if (file_x > line.length-tabs) {
                    file_x = line.length-tabs;
                }
                self._set_pointer(file_x, y);
            } else {
                if (self._cursor_offset > 0 && self._pointer.y != y) {
                    // redraw old long-line-mode line
                    self._draw_line(self._pointer.y - self._offset, line);
                }
                if (self._lines[y]) {
                    if (x > self._lines[y].length) {
                        x = self._lines[y].length;
                    }
                    self._set_pointer(x, y);
                }
            }
        });
        if (settings.enabled) {
            this.focus();
        } else {
            this.blur();
        }
    }
    // -----------------------------------------------------------------------
    micro.prototype = {
        // ---------------------------------------------------------------------
        // :: Print line of keys in the footer
        // ---------------------------------------------------------------------
        _print_footer_line: function(keys, footer_line) {
            var self = this;
            var size = Math.round(this._cols / keys.length) - 3;
            $.each(keys, function(i, key) {
                $('<span>' + key[0] + '</span>').addClass('key').
                    appendTo(footer_line);
                var desc;
                if (key[1].length > size) {
                    desc = key[1].substring(0, size);
                } else if (key[1].length < size) {
                    desc = key[1] + str_repeat(' ', size-key[1].length);
                } else {
                    desc = key[1];
                }
                $('<span>' + self._encode(' ' + desc) + '</span>').
                    appendTo(footer_line);
            });
        },
        // ---------------------------------------------------------------------
        // :: Print footer page with list of keys
        // ---------------------------------------------------------------------
        _print_footer_keys: function(footer) {
            var line_1, line_2;
            switch(footer) {
            case FOOTER_DEFAULT:
                line_1 = [
                    ['^G', $.micro.strings.get_help],
                    ['^O', $.micro.strings.write_out],
                    ['^R', $.micro.strings.read_file],
                    ['^Y', $.micro.strings.prev_page],
                    ['^K', $.micro.strings.cut_text],
                    ['^C', $.micro.strings.cur_pos]
                ];
                line_2 = [
                    ['^X', $.micro.strings.exit],
                    ['^J', $.micro.strings.justify],
                    ['^W', $.micro.strings.where_is],
                    ['^V', $.micro.strings.next_page],
                    ['^U', $.micro.strings.uncut_text],
                    ['^T', $.micro.strings.to_spell]
                ];
                break;
            }
            var self = this;
            if (line_1) {
                this._print_footer_line(line_1, this._footer_line_1);
            }
            if (line_2) {
                this._print_footer_line(line_2, this._footer_line_2);
            }
        },
        // ---------------------------------------------------------------------
        // :: Insert text in a place of the editor
        // ---------------------------------------------------------------------
        insert: function(string) {
            var lines = string.split('\n');
            var line = this._lines[this._pointer.y];
            var rest = line.slice(this._pointer.x);
            this._lines[this._pointer.y] = line.slice(0, this._pointer.x) + lines[0];
            if (lines.length == 1) {
                this._lines[this._pointer.y] += rest;
                this._set_pointer(this._pointer.x+string.length, this._pointer.y);
                this._draw_cursor_line();
            } else {
                lines[0] = line.slice(0, this._pointer.x) + lines[0];
                var x = lines[lines.length-1].length;
                lines[lines.length-1] += rest;
                this._lines = this._lines.slice(0, this._pointer.y-1).
                    concat(lines).concat(this._lines.slice(this._pointer.y+1));
                this._set_pointer(x, this._pointer.y+lines.length-2);
                this._view(this._offset);
            }
        },
        // ---------------------------------------------------------------------
        // :: Set Editor focus
        // ---------------------------------------------------------------------
        focus: function() {
            this._focus = true;
            this._table.find('.inactive').removeClass('inactive').css({
                width: '',
                height: ''
            });
            this._input.focus();
        },
        // ---------------------------------------------------------------------
        // :: Get Editor out of Focus
        // ---------------------------------------------------------------------
        blur: function() {
            this._focus = false;
            this._table.find('.cursor').addClass('inactive').css({
                width: this._letter.width-2,
                height: this._letter.height-2
            });
        },
        // ---------------------------------------------------------------------
        // :: Return number of colums in editor
        // ---------------------------------------------------------------------
        cols: function() {
            return this._cols;
        },
        // ---------------------------------------------------------------------
        // :: Return number of rows in editor
        // ---------------------------------------------------------------------
        rows: function() {
            return this._rows;
        },
        // ---------------------------------------------------------------------
        // :: Remove everything that was created by editor
        // ---------------------------------------------------------------------
        destroy: function() {
            this._root.removeData('micro').removeClass('micro');
            this._table.remove();
            this._input.unbind('.micro');
            this._spacer.remove();
            this._footer.remove();
            this._message.remove();
            $(document).unbind('.micro');
        },
        // ---------------------------------------------------------------------
        // :: Refresh the editor, should be done when edit change it's size
        // ---------------------------------------------------------------------
        refresh: function() {
            this._letter = this._calculate_letter_size();
            this._rows = Math.floor(this._root.height() / this._letter.height) - 4;
            /*if (this._settings.cursorPosition) {
                --this._rows;
            }*/
            this._cols = Math.floor(this._root.width() / this._letter.width);
            this._matrix = [];
            this._table.empty();
            for (var i = 0; i < this._rows; ++i) {
                var line = $('<div/>').addClass('line').appendTo(this._table);
                this._matrix[i] = [];
                for (var j = 0; j < this._cols; ++j) {
                    var cell = $('<span>&nbsp;</span>').appendTo(line);
                    this._matrix[i][j] = cell;
                }
            }
            return this;
        },
        // ---------------------------------------------------------------------
        // :: Set content of editor with text
        // ---------------------------------------------------------------------
        set: function(text) {
            this._lines = text.split('\n');
            this._set_pointer(0, 0);
            this._view(0);
        },
        // ---------------------------------------------------------------------
        // :: get content of the editor
        // ---------------------------------------------------------------------
        get: function() {
            return this._lines.join('\n');
        },
        // ---------------------------------------------------------------------
        // :: Print text in message box about cursor position
        // ---------------------------------------------------------------------
        _print_cur_position: function() {
            var chars = 0;
            var all_chars = 0;
            var self = this;
            $.each(this._lines, function(i, line) {
                if (i < self._pointer.y) {
                    chars += line.length;
                } else if (i == self._pointer.y) {
                    chars += self._pointer.x;
                }
                all_chars += line.length;
            });
            var line = this._lines[this._pointer.y];
            var message = sprintf($.micro.strings.chr,
                                  this._pointer.y+1,
                                  this._lines.length,
                                  (this._pointer.y+1)*100/this._lines.length,
                                  this._pointer.x+1,
                                  line.length+1,
                                  (this._pointer.x+1)*100/(line.length+1),
                                  chars,
                                  all_chars,
                                  chars*100/all_chars);
            this.message('[ ' + message + ' ]');
        },
        // ---------------------------------------------------------------------
        // :: Set the cursor to be in position of a file
        // ---------------------------------------------------------------------
        _set_pointer: function(x, y) {
            if (y >= this._lines.length) {
                throw new Error("[micro::_set_pointer]: Y out of band (" + y + "/" +
                                this._lines.length + ")");
            }
            this._table.find('.cursor').removeClass('cursor');
            var line = this._lines[y];
            var old_line = this._lines[this._pointer.y];
            var tabs = this._tabs_count(line);
            var old_tabs = this._tabs_count(old_line);
            
            if (y != this._pointer.y) {
                // restore line if old cursor in long line
                if (this._pointer.x >= this._cols-old_tabs-1) {
                    this._draw_line(this._pointer.y-this._offset,
                                    this._lines[this._pointer.y]);
                }
                /*
                // fix position when there're tabs
                var before_tabs = (line.substr(0, x+1).match(/(\t)/g) || []).length;
                var before_old_tabs = (old_line.substr(0, this._pointer.x+1).match(/(\t)/g) || []).length;
                if (before_tabs != before_old_tabs) {
                    console.log('----------------');
                    console.log('x: ' + x);
                    console.log('new> ' + before_tabs);
                    console.log('old> ' + before_old_tabs);
                    if (line[x] == '\t') {
                        before_old_tabs += 1;
                    }
                    if (old_line[this._pointer.x] == '\t') {
                        before_tabs -= 1;
                    }
                    var diff = Math.abs(before_old_tabs-before_tabs)*3;
                    if (before_old_tabs > before_tabs) {
                        console.log('x+=diff');
                        x+=diff;
                    } else {
                        console.log('x-=diff');
                        x-=diff;
                    }
                    console.log('x: ' + x);
                }
                */
            }
            if (x > line.length) { // fix position if X out of Band
                x = line.length;
            } else if (x < 0) {
                x = 0;
            }
            var cursor_offset = Math.floor(this._rows / 2);
            var cursor_y;
            var offset = this._offset + this._rows - cursor_offset;
            if (y-this._offset >= this._rows) {
                // change page
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
            if (x+tabs >= this._cols-1) {
                this._pointer.x = x;
                this._pointer.y = y;
                this._draw_cursor_line();
                /*
                if (x+tabs > this._lines[y].length) {
                    // move to last character, happend if you are in longer line and
                    // move cursor up or down to shorter line
                    this._set_pointer(this._lines[y].length, y);
                } else {
                    // need to set them before because they are used by a function
                    this._pointer.x = x;
                    this._pointer.y = y;
                    this._draw_cursor_line();
                }*/
            } else {
                if (this._pointer.x+tabs >= this._cols-1) {
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
            if (this._settings.cursorPosition) {
                this._print_cur_position();
            }
        },
        // ---------------------------------------------------------------------
        // :: Encode html
        // ---------------------------------------------------------------------
        _encode: function(string) {
            return string.replace(/ /g, '&nbsp;').
                replace(/\t/g, str_repeat('&nbsp;', this._settings.tabStop));
        },
        // ---------------------------------------------------------------------
        // :: Draw line in place n in editor (n is between 0 and rows number)
        // ---------------------------------------------------------------------
        _draw_line: function(n, line) {
            var len = (line.length > this._cols ? this._cols : line.length), i;
            for (i = 0; i < len; ++i) {
                this._matrix[n][i].html(this._encode(line[i]));
            }
            var tabs = this._tabs_count(line);
            if (line.length + tabs > this._cols) {
                this._matrix[n][this._cols-1-tabs].html('$');
                if (tabs > 0) {
                    // clear spans after $ if there are tabs
                    for (i = this._cols-tabs; i<this._cols; ++i) {
                        this._matrix[n][i].html('&nbsp');
                    }
                }
            } else {
                for (i = line.length; i < this._cols; ++i) {
                    this._matrix[n][i].html('&nbsp');
                }
            }
        },
        // ---------------------------------------------------------------------
        // :: Helper function that return offset in long line edit mode
        // ---------------------------------------------------------------------
        _get_cursor_offset: function() {
            var line =  this._lines[this._pointer.y];
            var tabs = this._tabs_count(line);
            var multiplier = Math.floor((this._pointer.x+tabs) / (this._cols-1));
            var offest = (this._cols - this._settings.horizontalMoveOffset - 1) * multiplier;
            return offest-tabs;
        },
        // ---------------------------------------------------------------------
        // :: Helper function that return number of characters that can be added
        // :: when line have tabs
        // ---------------------------------------------------------------------
        _tabs_count: function(line) {
            return (line.match(/(\t)/g) || []).length * 3;
        },
        // ---------------------------------------------------------------------
        // :: Draw line in place of the cursor, if pointer.x is smaller then
        // :: number of columns then draw normal line
        // ---------------------------------------------------------------------
        _draw_cursor_line: function() {
            var y = this._pointer.y - this._offset;
            var line = this._lines[this._pointer.y];
            var tabs = this._tabs_count(line);
            if (this._pointer.x+tabs >= this._cols-1) {
                var start = this._get_cursor_offset();
                this._draw_line(y, '$' + line.substring(start, start+this._cols));
                var x = ((this._pointer.x+tabs) % (this._cols-1)) +
                    this._settings.horizontalMoveOffset + 1;
                this._matrix[y][x].addClass('cursor');
            } else {
                this._draw_line(y, line);
            }
        },
        // ---------------------------------------------------------------------
        // :: Draw file in editor starting from y offset
        // ---------------------------------------------------------------------
        _view: function(offset) {
            if (this._lines) {
                this._offset = offset;
                var lines = this._lines.slice(offset, offset+this._rows), i;
                var cursor_y = this._pointer.y-offset;
                if (lines[cursor_y].length > this._cols && this._pointer.x > this._cols) {
                    //console.log('_view -> x');
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
        // ---------------------------------------------------------------------
        // :: Return version
        // ---------------------------------------------------------------------
        version: function() {
            var v = '0.1.1';
            return v.match(/^\{\{V\}\}$/, v) ? '' : v;
        },
        // ---------------------------------------------------------------------
        // :: Set file name in top title bar
        // ---------------------------------------------------------------------
        _set_file_name: function(fname) {
            var text = '  jQuery Micro ' + this.version();
            text += str_repeat(' ', 30-text.length) + $.micro.strings.file + ': ' + fname;
            this._title.html(text.replace(/ /g, '&nbsp;'));
        },
        // ---------------------------------------------------------------------
        // :: Print message in bottom message box
        // ---------------------------------------------------------------------
        message: function(string) {
            this._message.html(this._encode(string));
        },
        // ---------------------------------------------------------------------
        // :: Open a file using ajax
        // ---------------------------------------------------------------------
        open: function(fname, callback) {
            var self = this;
            $.get(fname, function(text) {
                self._set_file_name(fname.replace(/.*\//, ''));
                self._lines = text.split('\n');
                self._view(0);
                self._set_pointer(0, 0);
                if (typeof callback === 'function') {
                    callback();
                }
            });
            return this;
        },
        // ---------------------------------------------------------------------
        // :: Calculate size (in pixels) of single character
        // ---------------------------------------------------------------------
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
            tabStop: 4,
            cursorPosition: false,
            save: null,
            exit: null,
            width: '100%',
            height: '400px',
            verticalMoveOffset: 9, // when you move cursor out of editor verticaly
            horizontalMoveOffset: 6 // when you move cursor out of line
        },
        // strings use by editor, can be translated
        strings: {
            file:       'File',
            read:       'Read %s Lines',
            chr:        'line %d/%d (%d%%), col %d/%d (%d%%), char %d/%d (%d%%)',
            no_save:    'You need to provide save function',
            get_help:   'Get Help',
            exit:       'Exit',
            write_out:  'WriteOut',
            justify:    'Justify',
            read_file:  'Read File',
            where_is:   'Where is',
            prev_page:  'Prev Page',
            next_page:  'Next Page',
            cut_text:   'Cut Text',
            uncut_text: 'Uncut Text',
            cur_pos:    'Cur Pos',
            to_spell:   'To Speel'
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
                if (this.length == 1) {
                    var micro = $(this).data('micro');
                    return $.micro.fn[arg].apply(micro, args);
                } else {
                    return $.each(this, function() {
                        var micro = $(this).data('micro');
                        $.micro.fn[arg].apply(micro, args);
                    });
                }
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

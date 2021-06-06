var Toolbars, BarItems, Toolbox;
//Bars
class MenuSeparator {
	constructor() {
		this.menu_node = $('<li class="menu_separator"></li>')
	}
}
class BarItem {
	constructor(id, data) {
		this.id = id;
		if (!data.private) {
			BarItems[this.id] = this;
		}
		this.name = tl('action.'+this.id)
		if (data.name) this.name = tl(data.name);

		this.description = tl('action.'+this.id+'.desc')
		if (data.description) {
			this.description = tl(data.description);
		} else {
			var key = `action.${this.id}.desc`;
			this.description = tl('action.'+this.id+'.desc')
			if (this.description == key) this.description = '';
		}
		this.color = data.color
		this.node;
		this.condition = data.condition;
		this.nodes = []
		this.toolbars = []
		//Key
		this.category = data.category ? data.category : 'misc'
		if (!data.private && this.condition !== false/*Rule out app/web only actions*/) {
			if (data.keybind) {
				this.default_keybind = data.keybind
			}
			if (Keybinds.stored[this.id]) {
				this.keybind = new Keybind().set(Keybinds.stored[this.id], this.default_keybind);
			} else {
				this.keybind = new Keybind().set(data.keybind);
			}
			this.keybind.setAction(this.id)
			this.work_in_dialog = data.work_in_dialog === true
			this.uses = 0;
			Keybinds.actions.push(this)
		}
	}
	conditionMet() {
		return Condition(this.condition)
	}
	addLabel(in_bar, action) {
		if (!action || this instanceof BarItem) {
			action = this;
		}

		if (in_bar) {
			let label = document.createElement('label');
			label.classList.add('f_left', 'toolbar_label')
			label.innerText = action.name;
			this.node.classList.add('has_label')
			this.node.prepend(label)
		} else {
			let tooltip = document.createElement('div');
			tooltip.className = 'tooltip';
			tooltip.innerText = action.name;
			
			let label = document.createElement('label');
			label.className = 'keybinding_label';
			label.innerText = action.keybind || '';
			tooltip.append(label);

			if (action.description) {
				let description = document.createElement('div');
				description.className = 'tooltip_description';
				description.innerText = action.description;
				tooltip.append(description);
			}

			action.node.prepend(tooltip);

			action.node.addEventListener('mouseenter', () => {
				var tooltip = $(this).find('div.tooltip');
				if (!tooltip.length) return;
				var description = tooltip.find('.tooltip_description');

				if ($(this).parent().parent().hasClass('vertical')) {
					tooltip.css('margin', '0')
					if ($(this).offset().left > window.innerWidth/2) {
						tooltip.css('margin-left', (-tooltip.width()-3) + 'px')
					} else {
						tooltip.css('margin-left', '34px')
					}
				} else {

					tooltip.css('margin-left', '0')
					var offset = tooltip && tooltip.offset()
					offset.right = offset.left + parseInt(tooltip.css('width').replace(/px/, '')) - window.innerWidth

					if (offset.right > 4) {
						tooltip.css('margin-left', -offset.right+'px')
					}				

					// description
					if (!description.length) return;

					description.css('margin-left', '-5px')
					var offset = description.offset()
					offset.right = offset.left + parseInt(description.css('width').replace(/px/, '')) - window.innerWidth

					if (offset.right > 4) {
						description.css('margin-left', -offset.right+'px')
					}

					// height
					if ((window.innerHeight - offset.top) < 28) {
						tooltip.css('margin-top', -tooltip.height()+'px');
						description.css('margin-top', '-51px');
					}
				}
			})
		}
	}
	getNode() {
		var scope = this;
		if (scope.nodes.length === 0) {
			scope.nodes = [scope.node]
		}
		if (!scope.node.isConnected) {
			$(scope.node).detach()
			return scope.node;
		}
		var i = 0;
		while (i < scope.nodes.length) {
			if (!scope.nodes[i].isConnected) {
				$(scope.nodes[i]).detach()
				return scope.nodes[i];
			}
			i++;
		}
		var clone = $(scope.node).clone(true, true).get(0);
		clone.onclick = (e) => {
			scope.trigger(e)
		}
		scope.nodes.push(clone);
		return clone;
	}
	toElement(destination) {
		$(destination).first().append(this.getNode())
		return this;
	}
	pushToolbar(bar) {
		var scope = this;
		if (scope.uniqueNode && scope.toolbars.length) {
			for (var i = scope.toolbars.length-1; i >= 0; i--) {
				scope.toolbars[i].remove(scope)
			}
		}
		bar.children.push(this)
		this.toolbars.safePush(bar)
	}
	delete() {
		var scope = this;
		this.toolbars.forEach(bar => {
			bar.remove(scope);
		})
		delete BarItems[this.id];
		Keybinds.actions.remove(this);
	}
}
class KeybindItem {
	constructor(id, data) {
		if (typeof id == 'object') {
			data = id;
			id = data.id;
		}
		this.id = id
		this.type = 'keybind_item'
		this.name = tl('keybind.'+this.id)
		this.category = data.category ? data.category : 'misc'
		if (data.keybind) {
			this.default_keybind = data.keybind
		}
		if (Keybinds.stored[this.id]) {
			this.keybind = new Keybind().set(Keybinds.stored[this.id], this.default_keybind);
		} else {
			this.keybind = new Keybind().set(data.keybind);
		}

		Keybinds.actions.push(this)
		Keybinds.extra[this.id] = this;
		this.keybind.setAction(this.id)
	}
}
class Action extends BarItem {
	constructor(id, data) {
		if (typeof id == 'object') {
			data = id;
			id = data.id;
		}
		super(id, data)
		var scope = this;
		this.type = 'action'
		//Icon
		this.icon = data.icon

		if (data.linked_setting) {
			if (!data.name) this.name = tl(`settings.${data.linked_setting}`);
			if (!data.description) this.description = tl(`settings.${data.linked_setting}.desc`);
			this.linked_setting = data.linked_setting;
		}
		if (data.condition) this.condition = data.condition
		this.children = data.children;

		//Node
		if (!this.click) this.click = data.click
		this.icon_node = Blockbench.getIconNode(this.icon, this.color)
		this.icon_states = data.icon_states;
		this.node = document.createElement('div');
		this.node.classList.add('tool', this.id);
		this.node.append(this.icon_node);
		this.nodes = [this.node]
		this.menus = [];
		
		this.menu_node = document.createElement('li');
		this.menu_node.title = this.description || '';
		this.menu_node.append(this.icon_node.cloneNode(true));
		let span = document.createElement('span');
		span.innerText = this.name;
		this.menu_node.append(span);
		let label = document.createElement('label');
		label.classList.add('keybinding_label')
		label.innerText = this.keybind || '';
		this.menu_node.append(label);

		this.addLabel(data.label)
		this.updateKeybindingLabel()
		this.node.onclick = (e) => {
			scope.trigger(e)
		}
	}
	trigger(event) {
		var scope = this;
		if (BARS.condition(scope.condition, scope)) {
			if (event && event.type === 'click' && event.altKey && scope.keybind) {
				var record = function() {
					document.removeEventListener('keyup', record)
					scope.keybind.record()
				}
				document.addEventListener('keyup', record, false)
				return true;
			}
			scope.click(event)
			scope.uses++;

			$(scope.nodes).each(function() {
				this.style.setProperty('color', 'var(--color-light)')
			})
			setTimeout(function() {
				$(scope.nodes).each(function() {
					this.style.setProperty('color', '')
				})
			}, 200)
			return true;
		}
		return false;
	}
	updateKeybindingLabel() {
		$(this.menu_node).find('.keybinding_label').text(this.keybind || '');
		this.nodes.forEach(node => {
			$(node).find('.keybinding_label').text(this.keybind || '');
		});
		return this;
	}
	setIcon(icon) {
		var scope = this;
		this.icon = icon
		this.icon_node = Blockbench.getIconNode(this.icon)
		$(this.menu_node).find('.icon').replaceWith(this.icon_node)

		this.nodes.forEach(function(n) {
			$(n).find('.icon').replaceWith($(scope.icon_node).clone())
		})
	}
	delete() {
		super.delete();
		for (var i = this.menus.length-1; i >= 0; i--) {
			var m = this.menus[i]
			if (m.menu) {
				m.menu.deleteItem(this)
			}
		}
	}
}
class Tool extends Action {
	constructor(id, data) {
		if (typeof id == 'object') {
			data = id;
			id = data.id;
		}
		super(id, data);
		var scope = this;
		this.type = 'tool'
		this.toolbar = data.toolbar;
		this.alt_tool = data.alt_tool;
		this.modes = data.modes;
		this.selectFace = data.selectFace;
		this.cursor = data.cursor;
		this.selectCubes = data.selectCubes !== false;
		this.paintTool = data.paintTool;
		this.brushTool = data.brushTool;
		this.transformerMode = data.transformerMode;
		this.animation_channel = data.animation_channel;
		this.allowed_view_modes = data.allowed_view_modes || null;
		this.tool_settings = {};

		if (!this.condition) {
			this.condition = function() {
				return !scope.modes || scope.modes.includes(Modes.id);
			}
		}
		this.onCanvasClick = data.onCanvasClick;
		this.onSelect = data.onSelect;
		this.onUnselect = data.onUnselect;
		this.node.onclick = () => {
			scope.select();
		}
	}
	select() {
		if (this === Toolbox.selected) return;
		if (Toolbox.selected) {
			Toolbox.selected.nodes.forEach(node => {
				node.classList.remove('enabled')
			})
			Toolbox.selected.menu_node.classList.remove('enabled')
			if (typeof Toolbox.selected.onUnselect == 'function') {
				Toolbox.selected.onUnselect()
			}
			if (Transformer.dragging) {
				Transformer.cancelMovement({}, true);
			}
		}
		Toolbox.selected = this;
		delete Toolbox.original;
		this.uses++;

		if (this.transformerMode) {
			Transformer.setMode(this.transformerMode)
		}
		if (this.allowed_view_modes && !this.allowed_view_modes.includes(Prop.view_mode)) {
			Prop.view_mode = 'textured';
			Canvas.updateAllFaces()
		}
		if (this.toolbar && Toolbars[this.toolbar]) {
			Toolbars[this.toolbar].toPlace('tool_options')
		} else {
			$('.toolbar_wrapper.tool_options > .toolbar').detach()
		}

		if (typeof this.onSelect == 'function') {
			this.onSelect()
		}
		$('#preview').css('cursor', (this.cursor ? this.cursor : 'default'))
		this.nodes.forEach(node => {
			node.classList.add('enabled')
		})
		this.menu_node.classList.add('enabled')
		TickUpdates.selection = true;
		return this;
	}
	trigger(event) {
		var scope = this;
		if (BARS.condition(scope.condition, scope)) {
			this.select()
			return true;
		} else if (event.type.includes('key') && this.modes) {
			for (var i = 0; i < this.modes.length; i++) {
				var mode = Modes.options[this.modes[i]]
				if (mode && Condition(mode.condition)) {
					mode.select()
					this.select()
					return true;
				}
			}
		}
		return false;
	}
}
class Toggle extends Action {
	constructor(id, data) {
		super(id, data);
		this.type = 'toggle';
		this.value = data.default || false;
		if (this.linked_setting && settings[this.linked_setting]) {
			this.value = settings[this.linked_setting].value;
		}
		this.onChange = data.onChange;

		this.menu_icon_node = Blockbench.getIconNode('check_box_outline_blank');
		$(this.menu_node).find('.icon').replaceWith(this.menu_icon_node);

		this.updateEnabledState();
	}
	click() {
		this.value = !this.value;
		if (this.linked_setting && settings[this.linked_setting]) {
			let setting = settings[this.linked_setting];
			setting.value = this.value;
			if (setting.onChange) setting.onChange(setting.value);
			Settings.saveLocalStorages();
		}
		if (this.onChange) this.onChange(this.value);

		this.updateEnabledState();
	}
	setIcon(icon) {
		if (icon) {
			this.icon = icon;
			this.icon_node = Blockbench.getIconNode(this.icon);
			this.nodes.forEach(n => {
				$(n).find('.icon').replaceWith($(this.icon_node).clone());
			})
		}
	}
	updateEnabledState() {
		this.nodes.forEach(node => {
			node.classList.toggle('enabled', this.value);
		})
		this.menu_icon_node.innerText = this.value ? 'check_box' : 'check_box_outline_blank';
	}
}
class Widget extends BarItem {
	constructor(id, data) {
		if (typeof id == 'object') {
			data = id;
			id = data.id;
		}
		super(id, data);
		this.type = 'widget';
		//this.uniqueNode = true;
	}
}
class NumSlider extends Widget {
	constructor(id, data) {
		if (typeof id == 'object') {
			data = id;
			id = data.id;
		}
		super(id, data);
		this.uv = !!data.uv;
		this.type = 'numslider'
		this.icon = 'code'
		this.value = 0;
		this.width = 69;
		this.uniqueNode = true;
		if (data.tool_setting) this.tool_setting = data.tool_setting;
		if (typeof data.get === 'function') this.get = data.get;
		this.onBefore = data.onBefore;
		this.onAfter = data.onAfter;
		if (typeof data.change === 'function') this.change = data.change;
		if (data.settings) {
			this.settings = data.settings;
			if (this.settings.default) {
				this.value = this.settings.default
			}
			this.interval = this.settings.step || this.settings.interval;

		} else {
			this.interval = function(event) {
				event = event||0;
				if (!event.shiftKey && !event.ctrlKey) {
					return 1
				} else if (event.ctrlKey && event.shiftKey) {
					return 0.025
				} else if (event.ctrlKey) {
					return 0.1
				} else if (event.shiftKey)  {
					return 0.25
				}
			}
		}
		if (typeof data.getInterval === 'function') {
			this.interval = data.getInterval;
		}
		if (this.keybind) {
			this.keybind.shift = null;
			this.keybind.label = this.keybind.getText();
		}
		var scope = this;
		var css_color = 'xyz'.includes(this.color) ? `var(--color-axis-${this.color})` : this.color;
		this.node = $( `<div class="tool wide widget nslide_tool">
							<div class="nslide_overlay">
								<div class="color_corner" style="border-color: ${css_color}"></div>
							</div>
							<div class="nslide tab_target" n-action="${this.id}"></div>
					  	</div>`).get(0);
		this.jq_outer = $(this.node)
		this.jq_inner = this.jq_outer.find('.nslide');

		this.addLabel(data.label);

		this.jq_inner
		.on('mousedown touchstart', async (event) => {
			if (scope.jq_inner.hasClass('editing')) return;
			
			let drag_event = await new Promise((resolve, reject) => {
				function move(e2) {
					removeEventListeners(document, 'mousemove touchmove', move);
					removeEventListeners(document, 'mouseup touchend', stop);
					resolve(e2);
				}
				function stop(e2) {
					removeEventListeners(document, 'mousemove touchmove', move);
					removeEventListeners(document, 'mouseup touchend', stop);
					if (event.target == event.target) scope.startInput(event)
					resolve(false);
				}
				addEventListeners(document, 'mousemove touchmove', move);
				addEventListeners(document, 'mouseup touchend', stop);
			})
			if (!drag_event) return;

			if (typeof scope.onBefore === 'function') {
				scope.onBefore()
			}
			convertTouchEvent(drag_event)
			let clientX = drag_event.clientX;
			scope.sliding = true;
			scope.pre = 0;
			scope.sliding_start_pos = drag_event.clientX;
			scope.last_value = scope.value;
			let move_calls = 0;

			if (!drag_event.touches) scope.jq_inner.get(0).requestPointerLock();

			function move(e) {
				convertTouchEvent(e)
				if (drag_event.touches) {
					clientX = e.clientX;
				} else {
					let limit = move_calls <= 2 ? 1 : 160;
					clientX += Math.clamp(e.movementX, -limit, limit);
				}
				scope.slide(clientX, e);
				move_calls++;
			}
			function stop(e) {
				removeEventListeners(document, 'mousemove touchmove', move);
				removeEventListeners(document, 'mouseup touchend', stop);
				document.exitPointerLock()
				Blockbench.setStatusBarText();
				delete scope.sliding;
				if (typeof scope.onAfter === 'function') {
					scope.onAfter(scope.value - scope.last_value)
				}
			}
			addEventListeners(document, 'mousemove touchmove', move);
			addEventListeners(document, 'mouseup touchend', stop);
		})
		//Input
		.keypress(function (e) {
			if (e.keyCode === 10 || e.keyCode === 13) {
				e.preventDefault();
				scope.stopInput();
			}
		})
		.keyup(function (e) {
			if (e.keyCode !== 10 && e.keyCode !== 13) {
				scope.input()
			}
			if (e.keyCode === 27) {
				if (!scope.jq_inner.hasClass('editing')) return;
				e.preventDefault();
				scope.jq_inner.removeClass('editing')
				scope.jq_inner.attr('contenteditable', 'false')
				scope.update()
			}
		})
		.focusout(function() {
			scope.stopInput()
		})
		.dblclick(function(event) {
			if (event.target != this) return;
			scope.jq_inner.text('0');
			scope.stopInput()

		});
		//Arrows
		this.jq_outer
		.on('mouseenter', function() {
			scope.jq_outer.append(
				'<div class="nslide_arrow na_left" ><i class="material-icons">navigate_before</i></div>'+
				'<div class="nslide_arrow na_right"><i class="material-icons">navigate_next</i></div>'
			)

			var n = limitNumber(scope.width/2-24, 6, 1000)

			scope.jq_outer.find('.nslide_arrow.na_left').click(function(e) {
				scope.arrow(-1, e)
			}).css('margin-left', (-n-24)+'px')

			scope.jq_outer.find('.nslide_arrow.na_right').click(function(e) {
				scope.arrow(1, e)
			}).css('margin-left', n+'px')
		})
		.on('mouseleave', function() {
			scope.jq_outer.find('.nslide_arrow').remove()
		})
	}
	startInput(e) {
		this.jq_inner.find('.nslide_arrow').remove()
		this.jq_inner.attr('contenteditable', 'true')
		this.jq_inner.addClass('editing')
		this.jq_inner.focus()
		document.execCommand('selectAll')
	}
	setWidth(width) {
		if (width) {
			this.width = width
		} else {
			width = this.width
		}
		this.node.style.width = width + 'px';
		return this;
	}
	getInterval(e) {
		if (typeof this.interval == 'function') {
			return this.interval(e);
		} else if (typeof this.interval === 'number') {
			return this.interval;
		} else {
			return 0;
		}
	}
	slide(clientX, event) {
		var offset = Math.round((clientX - this.sliding_start_pos)/30)
		var difference = (offset - this.pre) * this.getInterval(event);
		this.pre = offset;

		if (!difference) return;

		this.change(n => n + difference);
		this.update();
		Blockbench.setStatusBarText(trimFloatNumber(this.value - this.last_value));
	}
	input() {
		this.last_value = this.value;
	}
	stopInput() {
		if (!this.jq_inner.hasClass('editing')) return;
		var text = this.jq_inner.text();
		if (this.last_value !== text) {
			var first_token = text.substr(0, 1);

			if (typeof this.onBefore === 'function') {
				this.onBefore()
			}
			text = text.replace(/,(?=\d+$)/, '.');
			if (text.match(/^-?\d*(\.\d+)?$/gm)) {
				var number = parseFloat(text);
				if (isNaN(number)) {
					number = 0;
				}
				this.change(val => number);
			} else {
				var n = 0;
				this.change(val => {
					var variables = {
						val: val,
						n
					};
					n++;

					if ('+*/'.includes(first_token)) {
						return NumSlider.MolangParser.parse(val + text, variables)
					} else {
						return NumSlider.MolangParser.parse(text, variables)
					}
				});
			}
			if (typeof this.onAfter === 'function') {
				this.onAfter()
			}
		}
		this.jq_inner.removeClass('editing')
		this.jq_inner.attr('contenteditable', 'false')
		this.update()
	}
	arrow(difference, event) {
		if (typeof this.onBefore === 'function') {
			this.onBefore()
		}
		difference *= this.getInterval(event)
		this.change(n => n + difference)
		this.update()
		if (typeof this.onAfter === 'function') {
			this.onAfter(difference)
		}
	}
	trigger(event) {
		if (!Condition(this.condition)) return false;
		if (typeof this.onBefore === 'function') {
			this.onBefore()
		}
		var difference = this.getInterval(false) * (event.shiftKey != event.deltaY > 0) ? -1 : 1;
		this.change(n => n + difference)
		this.update()
		if (typeof this.onAfter === 'function') {
			this.onAfter(difference)
		}
		return true;
	}
	setValue(value, trim) {
		if (typeof value === 'string') {
			value = parseFloat(value)
		}
		if (trim === false) {
			this.value = value
		} else if (typeof value === 'number') {
			this.value = trimFloatNumber(value)
		} else {

		}
		this.jq_outer.find('.nslide:not(.editing)').text(this.value)
		return this;
	}
	change(modify) {
		//Solo sliders only, gets overwritten for most sliders
		var num = modify(this.get());
		if (this.settings && typeof this.settings.min === 'number') {
			num = limitNumber(num, this.settings.min, this.settings.max)
		}
		this.value = num;
		if (this.tool_setting) {
			Toolbox.selected.tool_settings[this.tool_setting] = num;
		}
	}
	get() {
		//Solo Sliders only
		if (this.tool_setting) {
			return Toolbox.selected.tool_settings[this.tool_setting] != undefined
				 ? Toolbox.selected.tool_settings[this.tool_setting]
				 : (this.settings.default||0)
		} else {
			return parseFloat(this.value);
		}
	}
	update() {
		if (!BARS.condition(this.condition)) return;
		var number = this.get();
		this.setValue(number)
		if (isNaN(number)) {
			this.jq_outer.find('.nslide:not(.editing)').text('')
		}
		if (this.sliding) {
			$('#nslide_head #nslide_offset').text(this.name+': '+this.value)
		}
	}
}
NumSlider.MolangParser = new Molang()

class BarSlider extends Widget {
	constructor(id, data) {
		if (typeof id == 'object') {
			data = id;
			id = data.id;
		}
		super(id, data);
		var scope = this;
		this.type = 'slider'
		this.icon = 'fa-sliders-h'
		this.value = data.value||0
		this.node = $('<div class="tool widget">'+
			'<input type="range"'+
				' value="'+(data.value?data.value:0)+'" '+
				' min="'+(data.min?data.min:0)+'" '+
				' max="'+(data.max?data.max:10)+'" '+
				' step="'+(data.step?data.step:1)+'" '+
				' style="width: '+(data.width?data.width:'auto')+'px;">'+
		'</div>').get(0)
		this.addLabel()
		if (typeof data.onChange === 'function') {
			this.onChange = data.onChange
		}
		if (typeof data.onBefore === 'function') {
			this.onBefore = data.onBefore
		}
		if (typeof data.onAfter === 'function') {
			this.onAfter = data.onAfter
		}
		$(this.node).children('input').on('input', function(event) {
			scope.change(event)
		})
		if (scope.onBefore) {
			$(this.node).children('input').on('mousedown', function(event) {
				scope.onBefore(event)
			})
		}
		if (scope.onAfter) {
			$(this.node).children('input').on('change', function(event) {
				scope.onAfter(event)
			})
		}
	}
	change(event) {
		this.set( parseFloat( $(event.target).val() ) )
		if (this.onChange) {
			this.onChange(this, event)
		}
	}
	set(value) {
		this.value = value
		$(this.nodes).children('input').val(value)
	}
	get() {
		return this.value
	}
}
class BarSelect extends Widget {
	constructor(id, data) {
		if (typeof id == 'object') {
			data = id;
			id = data.id;
		}
		super(id, data);
		var scope = this;
		this.type = 'select'
		this.icon = 'list'
		this.node = $('<div class="tool widget bar_select"><bb-select></bb-select></div>').get(0)
		var select = $(this.node).find('bb-select')
		if (data.width) {
			select.css('width', data.width+'px')
		}
		if (data.min_width) {
			select.css('min-width', data.min_width+'px')
		}
		select.click(event => {
			scope.open(event)
		});
		this.value = data.value
		this.values = [];
		this.options = data.options;
		if (data.options) {
			for (var key in data.options) {
				if (!this.value) {
					this.value = key
				}
				this.values.push(key);
			}
		}
		this.set(this.value)
		this.addLabel()
		if (typeof data.onChange === 'function') {
			this.onChange = data.onChange
		}
		$(this.node).on('mousewheel', event => {
			scope.trigger(event.originalEvent);
		})
	}
	open(event) {
		let scope = this;
		let items = [];
		for (var key in this.options) {
			let val = this.options[key];
			if (val) {
				(function() {
					var save_key = key;
					items.push({
						name: scope.getNameFor(key),
						icon: val.icon || ((scope.value == save_key) ? 'far.fa-dot-circle' : 'far.fa-circle'),
						condition: val.condition,
						click: (e) => {
							scope.set(save_key);
							if (scope.onChange) {
								scope.onChange(scope, e);
							}
						}
					})
				})()
			}
		}
		let menu = new Menu(items);
		menu.node.style['min-width'] = this.node.clientWidth+'px';
		menu.open(event.target, this);
	}
	trigger(event) {
		if (!event) event = 0;
		var scope = this;
		if (BARS.condition(scope.condition, scope)) {
			if (event && event.type === 'click' && event.altKey && scope.keybind) {
				var record = function() {
					document.removeEventListener('keyup', record)
					scope.keybind.record()
				}
				document.addEventListener('keyup', record, false)
				return true;
			}

			var index = this.values.indexOf(this.value)
			function advance() {
				if (event.type === 'mousewheel' || event.type === 'wheel') {
					index += event.deltaY < 0 ? -1 : 1;
				} else {
					index++;
					if (index >= scope.values.length) index = 0;
				}
			}
			for (var i = 0; i < 40; i++) {
				advance()
				if (index < 0 || index >= this.values.length) return;
				let opt = this.options[this.values[index]];
				if (opt && Condition(opt.condition)) break;
			}
			this.set(this.values[index]);
			if (this.onChange) {
				this.onChange(this, event);
			}
			
			scope.uses++;
			return true;
		}
		return false;
	}
	change(event) {
		this.set( $(event.target).find('option:selected').prop('id') );
		if (this.onChange) {
			this.onChange(this, event);
		}
		return this;
	}
	getNameFor(key) {
		let val = this.options[key];
		let name = tl(val === true || (val && val.name === true)
				? ('action.'+this.id+'.'+key) 
				: ((val && val.name) || val)
			);
		return name;
	}
	set(key) {
		if (this.options[key] == undefined) {
			console.warn(`Option ${key} does not exist in BarSelect ${this.id}`)
			return this;
		}
		this.value = key;
		let name = this.getNameFor(key);
		this.nodes.forEach(node => {
			$(node).find('bb-select').text(name)
		})
		if (!this.nodes.includes(this.node)) {
			$(this.node).find('bb-select').text(name)
		}
		return this;
	}
	get() {
		return this.value;
	}
}
class BarText extends Widget {
	constructor(id, data) {
		if (typeof id == 'object') {
			data = id;
			id = data.id;
		}
		super(id, data);
		this.type = 'bar_text'
		this.icon = 'text_format'
		this.node = $('<div class="tool widget bar_text">'+data.text||''+'</div>').get(0)
		if (data.right) {
			$(this.node).addClass('f_right')
		}
		this.onUpdate = data.onUpdate;
		if (typeof data.click === 'function') {
			this.click = data.click;
			this.node.addEventListener('click', this.click)
		}
	}
	set(text) {
		this.text = text;
		$(this.nodes).text(text)
		return this;
	}
	update() {
		if (typeof this.onUpdate === 'function') {
			this.onUpdate()
		}
		return this;
	}
	trigger(event) {
		if (!Condition(this.condition)) return false;
		Blockbench.showQuickMessage(this.text)
		return true;
	}
}
class ColorPicker extends Widget {
	constructor(id, data) {
		if (typeof id == 'object') {
			data = id;
			id = data.id;
		}
		super(id, data);
		var scope = this;
		this.type = 'color_picker'
		this.icon = 'color_lens'
		this.node = $('<div class="tool widget"><input class="f_left" type="text"></div>').get(0)
		this.addLabel()
		this.jq = $(this.node).find('input')
		if (typeof data.onChange === 'function') {
			this.onChange = data.onChange
		}
		this.value = new tinycolor('ffffff')
		this.jq.spectrum({
			preferredFormat: "hex",
			color: data.value || 'ffffff',
			showAlpha: true,
			showInput: true,
			maxSelectionSize: 128,
			showPalette: data.palette === true,
			palette: data.palette ? [] : undefined,
			resetText: tl('generic.reset'),
			cancelText: tl('dialog.cancel'),
			chooseText: tl('dialog.confirm'),
			show: function() {
				open_interface = scope
			},
			hide: function() {
				open_interface = false
			},
			change: function(c) {
				scope.change(c)
			}
		})
	}
	change(color) {
		if (this.onChange) {
			this.onChange()
		}
	}
	hide() {
		this.jq.spectrum('cancel');
	}
	confirm() {
		this.jq.spectrum('hide');
	}
	set(color) {
		this.value = new tinycolor(color)
		this.jq.spectrum('set', this.value.toHex8String())
		return this;
	}
	get() {
		this.value = this.jq.spectrum('get');
		return this.value;
	}
}
class Toolbar {
	constructor(data) {
		var scope = this;
		this.children = [];
		this.condition_cache = [];
		if (data) {
			this.id = data.id
			this.narrow = !!data.narrow
			this.vertical = !!data.vertical
			this.default_children = data.children.slice()
		}
		var jq = $(`<div class="toolbar">
			<div class="tool toolbar_menu">
				<i class="material-icons">${this.vertical ? 'more_horiz' : 'more_vert'}</i>
			</div>
			<div class="content"></div>
		</div>`)
		this.node = jq.get(0)
		BarItem.prototype.addLabel(false, {
			name: tl('data.toolbar'),
			node: jq.find('.tool.toolbar_menu').get(0)
		})
		if (data) {
			this.build(data)
		}
		$(this.node).find('div.toolbar_menu').click(function(event) {scope.contextmenu(event)})
	}
	build(data, force) {
		var scope = this;
		//Items
		this.children.length = 0;
		var items = data.children
		if (!force && BARS.stored[scope.id] && typeof BARS.stored[scope.id] === 'object') {
			items = BARS.stored[scope.id]
		}
		if (items && items.constructor.name === 'Array') {
			var content = $(scope.node).find('div.content')
			content.children().detach()
			items.forEach(function(id) {
				if (typeof id === 'string' && id.substr(0, 1) === '_') {
					content.append('<div class="toolbar_separator"></div>')
					scope.children.push('_'+guid().substr(0,8))
					return;
				}
				var item = BarItems[id]
				if (item) {
					item.pushToolbar(scope)
					if (BARS.condition(item.condition)) {
						content.append(item.getNode())
					}
				}
			})
		}
		$(scope.node).toggleClass('narrow', this.narrow)
		$(scope.node).toggleClass('vertical', this.vertical)
		if (data.default_place) {
			this.toPlace(this.id)
		}
		return this;
	}
	contextmenu(event) {
		var offset = $(this.node).find('.toolbar_menu').offset()
		if (offset) {
			event.clientX = offset.left+7
			event.clientY = offset.top+28
		}
		this.menu.open(event, this)
	}
	editMenu() {
		BARS.editing_bar = this;
		this.children.forEach(function(c, ci) {
		})
		BARS.list.currentBar = this.children;
		showDialog('toolbar_edit');
		
		return this;
	}
	add(action, position) {
		if (action instanceof BarItem && this.children.includes(action)) return this;
		if (position === undefined) position = this.children.length
		if (typeof action === 'object' && action.uniqueNode && action.toolbars.length) {
			for (var i = action.toolbars.length-1; i >= 0; i--) {
				action.toolbars[i].remove(action)
			}
		}
		//Adding
		this.children.splice(position, 0, action)
		if (typeof action === 'object') {
			action.toolbars.safePush(this)
		}
		this.update().save();
		return this;
	}
	remove(action) {
		var i = this.children.length-1;
		while (i >= 0) {
			var item = this.children[i]
			if (item === action || item.id === action) {
				item.toolbars.remove(this)
				this.children.splice(i, 1)
				this.update().save();
				return this;
			}
			i--;
		}
		return this;
	}
	update() {
		var scope = this;

		//scope.condition_cache.empty();
		let needsUpdate = scope.condition_cache.length !== scope.children.length;
		scope.condition_cache.length = scope.children.length;

		this.children.forEach(function(item, i) {
			let value = null;
			if (typeof item === 'object') {
				value = !!Condition(item.condition)
			}
			if (!needsUpdate && value !== scope.condition_cache[i]) {
				needsUpdate = true;
			}
			scope.condition_cache[i] = value;
		})
		if (!needsUpdate) return this;

		var content = $(this.node).find('.content')
		content.find('> .tool').detach()
		var separators = content.find('> .toolbar_separator').detach()
		var sep_nr = 0;

		this.children.forEach(function(item, i) {
			if (typeof item === 'string') {
				var last = content.find('> :last-child')
				if (last.length === 0 || last.hasClass('toolbar_separator') || i == scope.children.length-1) {
					return this;
				}
				var sep = separators[sep_nr]
				if (sep) {
					content.append(sep)
					sep_nr++;
				} else {
					content.append('<div class="toolbar_separator"></div>')
				}
			} else if (typeof item === 'object') {
				if (scope.condition_cache[i]) {
					content.append(item.getNode())
					item.toolbars.safePush(scope)
				} else {
					item.toolbars.remove(scope)
				}
			}
		})
		var last = content.find('> :last-child')
		if (last.length && last.hasClass('toolbar_separator')) {
			last.remove()
		}
		return this;
	}
	toPlace(place) {
		if (!place) place = this.id
		$('div.toolbar_wrapper.'+place+' > .toolbar').detach()
		$('div.toolbar_wrapper.'+place).append(this.node)
		return this;
	}
	save() {
		var arr = []
		this.children.forEach(function(c) {
			if (typeof c === 'string') {
				arr.push(c)
			} else {
				arr.push(c.id)
			}
		})
		BARS.stored[this.id] = arr
		localStorage.setItem('toolbars', JSON.stringify(BARS.stored))
		return this;
	}
	reset() {
		this.build({
			children: this.default_children,
			default_place: this.default_place
		}, true);
		this.update();
		this.save();
		return this;
	}
}
Toolbar.prototype.menu = new Menu([
		{name: 'menu.toolbar.edit', icon: 'edit', click: function(bar) {
			bar.editMenu()
		}},
		{name: 'menu.toolbar.reset', icon: 'refresh', click: function(bar) {
			bar.reset()
		}}
	])

const BARS = {
	stored: {},
	editing_bar: undefined,
	action_definers: [],
	condition: Condition,
	defineActions(definer) {
		BARS.action_definers.push(definer)
	},
	setupActions() {
		BarItems = {}

		//Extras
			new KeybindItem('preview_select', {
				category: 'navigate',
				keybind: new Keybind({key: Blockbench.isTouch ? 0 : 1, ctrl: null, shift: null, alt: null})
			})
			new KeybindItem('preview_rotate', {
				category: 'navigate',
				keybind: new Keybind({key: 1})
			})
			new KeybindItem('preview_drag', {
				category: 'navigate',
				keybind: new Keybind({key: 3})
			})

			new KeybindItem('confirm', {
				category: 'navigate',
				keybind: new Keybind({key: 13})
			})
			new KeybindItem('cancel', {
				category: 'navigate',
				keybind: new Keybind({key: 27})
			})

		//Tools
			new Tool('move_tool', {
				icon: 'icon-gizmo',
				category: 'tools',
				selectFace: true,
				transformerMode: 'translate',
				animation_channel: 'position',
				toolbar: Blockbench.isMobile ? 'element_position' : 'main_tools',
				alt_tool: 'resize_tool',
				modes: ['edit', 'display', 'animate'],
				keybind: new Keybind({key: 'v'}),
			})
			new Tool('resize_tool', {
				icon: 'open_with',
				category: 'tools',
				selectFace: true,
				transformerMode: 'scale',
				animation_channel: 'scale',
				toolbar: Blockbench.isMobile ? 'element_size' : 'main_tools',
				alt_tool: 'move_tool',
				modes: ['edit', 'display', 'animate'],
				keybind: new Keybind({key: 's'}),
			})
			new Tool('rotate_tool', {
				icon: 'sync',
				category: 'tools',
				selectFace: true,
				transformerMode: 'rotate',
				animation_channel: 'rotation',
				toolbar: Blockbench.isMobile ? 'element_rotation' : 'main_tools',
				alt_tool: 'pivot_tool',
				modes: ['edit', 'display', 'animate'],
				keybind: new Keybind({key: 'r'})
			})
			new Tool('pivot_tool', {
				icon: 'gps_fixed',
				category: 'tools',
				transformerMode: 'translate',
				toolbar: Blockbench.isMobile ? 'element_origin' : 'main_tools',
				alt_tool: 'rotate_tool',
				modes: ['edit', 'animate'],
				keybind: new Keybind({key: 'p'}),
			})
			new Tool('vertex_snap_tool', {
				icon: 'icon-vertexsnap',
				transformerMode: 'hidden',
				toolbar: 'vertex_snap',
				category: 'tools',
				selectCubes: true,
				cursor: 'copy',
				modes: ['edit'],
				keybind: new Keybind({key: 'x'}),
				onCanvasClick(data) {
					Vertexsnap.canvasClick(data)
				},
				onSelect: function() {
					Blockbench.addListener('update_selection', Vertexsnap.select)
					Vertexsnap.select()
				},
				onUnselect: function() {
					Vertexsnap.removeVertexes()
					Vertexsnap.step1 = true
					Blockbench.removeListener('update_selection', Vertexsnap.select)
				}
			})
			new BarSelect('vertex_snap_mode', {
				options: {
					move: true,
					scale: {condition: () => !Format.integer_size, name: true}
				},
				category: 'edit'
			})
			new Action('swap_tools', {
				icon: 'swap_horiz',
				category: 'tools',
				condition: {modes: ['edit', 'paint', 'display']},
				keybind: new Keybind({key: 32}),
				click: function () {
					if (BarItems[Toolbox.selected.alt_tool] && Condition(BarItems[Toolbox.selected.alt_tool].condition)) {
						BarItems[Toolbox.selected.alt_tool].select()
					}
				}
			})

		//File
			new Action('open_model_folder', {
				icon: 'folder_open',
				category: 'file',
				condition: () => {return isApp && (ModelMeta.save_path || ModelMeta.export_path)},
				click: function () {
					shell.showItemInFolder(ModelMeta.export_path || ModelMeta.save_path);
				}
			})
			new Action('open_backup_folder', {
				icon: 'fa-archive',
				category: 'file',
				condition: () => isApp,
				click: function (e) {
					shell.openItem(app.getPath('userData')+osfs+'backups')
				}
			})
			new Action('settings_window', {
				icon: 'settings',
				category: 'blockbench',
				click: function () {Settings.open()}
			})
			new Action('keybindings_window', {
				name: tl('dialog.settings.keybinds') + '...',
				icon: 'keyboard',
				category: 'blockbench',
				click: function () {Settings.open({tab: 'keybindings'})}
			})
			new Action('theme_window', {
				name: tl('dialog.settings.theme') + '...',
				icon: 'style',
				category: 'blockbench',
				click: function () {Settings.open({tab: 'layout_settings'})}
			})
			new Action('reload', {
				icon: 'refresh',
				category: 'file',
				condition: isApp,
				click: function () {
					if (Blockbench.hasFlag('dev') || confirm(tl('message.close_warning.web'))) {
						Blockbench.reload()
					}
				}
			})

		//Edit Generic
			new Action('rename', {
				icon: 'text_format',
				category: 'edit',
				keybind: new Keybind({key: 113}),
				click: function () {
					if (Modes.edit || Modes.paint) {
						renameOutliner()
					} else if (Prop.active_panel == 'animations' && Animation.selected) {
						Animation.selected.rename()
					}
				}
			})
			new Action('delete', {
				icon: 'delete',
				category: 'edit',
				//condition: () => (Modes.edit && (selected.length || Group.selected)),
				keybind: new Keybind({key: 46}),
				click: function () {
					if (Prop.active_panel == 'textures' && Texture.selected) {
						Texture.selected.remove()
					} else if (Prop.active_panel == 'color' && ['palette', 'both'].includes(ColorPanel.vue._data.open_tab)) {
						if (ColorPanel.vue._data.palette.includes(ColorPanel.vue._data.main_color)) {
							ColorPanel.vue._data.palette.remove(ColorPanel.vue._data.main_color)
						}
					} else if ((Modes.edit || Modes.paint) && (selected.length || Group.selected)) {

						var array;
						Undo.initEdit({elements: selected, outliner: true, selection: true})
						if (Group.selected) {
							Group.selected.remove(true)
							return;
						}
						if (array == undefined) {
							array = selected.slice(0)
						} else if (array.constructor !== Array) {
							array = [array]
						} else {
							array = array.slice(0)
						}
						array.forEach(function(s) {
							s.remove(false)
						})
						TickUpdates.selection = true;
						Undo.finishEdit('delete elements')

					} else if (Prop.active_panel == 'animations' && Animation.selected) {
						Animation.selected.remove(true)

					} else if (Animator.open) {
						removeSelectedKeyframes()
					}
				}
			})
			new Action('duplicate', {
				icon: 'content_copy',
				category: 'edit',
				condition: () => (Animation.selected && Modes.animate) || (Modes.edit && (selected.length || Group.selected)),
				keybind: new Keybind({key: 'd', ctrl: true}),
				click: function () {
					if (Modes.animate) {
						if (Animation.selected && Prop.active_panel == 'animations') {
							var copy = Animation.selected.getUndoCopy();
							var animation = new Animation(copy);
							animation.createUniqueName();
							Animator.animations.splice(Animator.animations.indexOf(Animation.selected)+1, 0, animation)
							animation.add(true).select();
						}
					} else if (Group.selected && (Group.selected.matchesSelection() || selected.length === 0)) {
						var cubes_before = elements.length;
						Undo.initEdit({outliner: true, elements: [], selection: true});
						var g = Group.selected.duplicate();
						g.select();
						Undo.finishEdit('duplicate_group', {outliner: true, elements: elements.slice().slice(cubes_before), selection: true})
					} else {
						var added_elements = [];
						Undo.initEdit({elements: added_elements, outliner: true, selection: true})
						selected.forEach(function(obj, i) {
							var copy = obj.duplicate();
							added_elements.push(copy);
						})
						BarItems.move_tool.select();
						Undo.finishEdit('duplicate')
					}
				}
			})


		//Settings
			new Action('open_dev_tools', {
				name: 'menu.help.developer.dev_tools',
				icon: 'fas.fa-tools',
				condition: isApp,
				work_in_dialog: true,
				keybind: new Keybind({ctrl: true, shift: true, key: 'i'}),
				work_in_dialog: true,
				click: () => {
					currentwindow.toggleDevTools();
				}
			})
			

		//View
			new Action('fullscreen', {
				icon: 'fullscreen',
				category: 'view',
				condition: isApp,
				work_in_dialog: true,
				keybind: new Keybind({key: 122}),
				click: function () {
					currentwindow.setFullScreen(!currentwindow.isFullScreen())
				}
			})
			new Action('zoom_in', {
				icon: 'zoom_in',
				category: 'view',
				work_in_dialog: true,
				click: function () {setZoomLevel('in')}
			})
			new Action('zoom_out', {
				icon: 'zoom_out',
				category: 'view',
				work_in_dialog: true,
				click: function () {setZoomLevel('out')}
			})
			new Action('zoom_reset', {
				icon: 'zoom_out_map',
				category: 'view',
				work_in_dialog: true,
				click: function () {setZoomLevel('reset')}
			})

		//Find Action
			new Action('action_control', {
				icon: 'fullscreen',
				category: 'blockbench',
				keybind: new Keybind({key: 'f'}),
				click: function () {
					ActionControl.select()
				}
			})

		BARS.action_definers.forEach((definer) => {
			if (typeof definer === 'function') {
				definer()
			}
		})
	},
	setupToolbars() {
		//
		Toolbars = {}
		var stored = localStorage.getItem('toolbars')
		if (stored) {
			stored = JSON.parse(stored)
			if (typeof stored === 'object') {
				BARS.stored = stored;
			}
		}
		Toolbars.outliner = new Toolbar({
			id: 'outliner',
			children: [
				'add_cube',
				'add_group',
				'outliner_toggle',
				'toggle_skin_layer',
				'cube_counter'
			]
		})
		if (!Toolbars.outliner.children.includes(BarItems.explode_skin_model)) {
			Toolbars.outliner.add(BarItems.explode_skin_model, -1)
		}

		Toolbars.texturelist = new Toolbar({
			id: 'texturelist',
			children: [
				'import_texture',
				'create_texture',
				'reload_textures'
			]
		})
		Toolbars.tools = new Toolbar({
			id: 'tools',
			children: [
				'move_tool',
				'resize_tool',
				'rotate_tool',
				'pivot_tool',
				'vertex_snap_tool',
				'brush_tool',
				'fill_tool',
				'eraser',
				'color_picker',
				'draw_shape_tool',
				'gradient_tool',
				'copy_paste_tool'
			],
			vertical: Blockbench.isMobile == true,
			default_place: true
		})

		Toolbars.element_position = new Toolbar({
			id: 'element_position',
			children: [
				'slider_pos_x',
				'slider_pos_y',
				'slider_pos_z'
			]
		})
		Toolbars.element_size = new Toolbar({
			id: 'element_size',
			children: [
				'slider_size_x',
				'slider_size_y',
				'slider_size_z',
				'slider_inflate'
			]
		})
		Toolbars.element_origin = new Toolbar({
			id: 'element_origin',
			children: [
				'slider_origin_x',
				'slider_origin_y',
				'slider_origin_z',
				'origin_to_geometry'
			]
		})
		Toolbars.element_rotation = new Toolbar({
			id: 'element_rotation',
			children: [
				'slider_rotation_x',
				'slider_rotation_y',
				'slider_rotation_z',
				'rescale_toggle'
			]
		})
		Toolbars.inverse_kinematics = new Toolbar({
			id: 'inverse_kinematics',
			children: [
				'ik_enabled',
				'slider_ik_chain_length'
			],
			default_place: !Blockbench.isMobile
		})


		Toolbars.palette = new Toolbar({
			id: 'palette',
			children: [
				'import_palette',
				'export_palette',
				'generate_palette',
				'sort_palette',
				'load_palette',
			]
		})
		Toolbars.color_picker = new Toolbar({
			id: 'color_picker',
			children: [
				'slider_color_h',
				'slider_color_s',
				'slider_color_v',
				'add_to_palette'
			]
		})



		Toolbars.display = new Toolbar({
			id: 'display',
			children: [
				'copy',
				'paste',
				'add_display_preset',
				'apply_display_preset',
				'gui_light'
			]
		})
		//UV
		Toolbars.main_uv = new Toolbar({
			id: 'main_uv',
			children: [
				'uv_grid',
				'uv_apply_all',
				'uv_maximize',
				'uv_auto',
				'uv_transparent',
				'uv_rotation',
				//Box
				'toggle_uv_overlay',
				'toggle_mirror_uv',
			]
		})
		Toolbars.uv_dialog = new Toolbar({
			id: 'uv_dialog',
			children: [
				'uv_grid',
				'_',
				'uv_select_all',
				'uv_select_none',
				'_',
				'uv_maximize',
				'uv_auto',
				'uv_rel_auto',
				'_',
				'uv_mirror_x',
				'uv_mirror_y',
				'_',
				'copy',
				'paste',
				'_',
				'uv_transparent',
				'uv_reset',
				'_',
				'face_tint',
				'_',
				'cullface',
				'auto_cullface',
				'_',
				'uv_rotation'
			],
			default_place: true
		})
		//Animations
		Toolbars.animations = new Toolbar({
			id: 'animations',
			children: [
				'add_animation',
				'load_animation_file',
				'slider_animation_length',
			]
		})
		Blockbench.onUpdateTo('3.8', () => {
			Toolbars.animations.add(BarItems.load_animation_file, 1);
		})
		Toolbars.keyframe = new Toolbar({
			id: 'keyframe',
			children: [
				'slider_keyframe_time',
				'keyframe_interpolation',
				'change_keyframe_file',
				'reset_keyframe'
			]
		})
		Toolbars.timeline = new Toolbar({
			id: 'timeline',
			children: [
				'timeline_graph_editor',
				'timeline_focus',
				'clear_timeline',
				'select_effect_animator',
				'add_marker',
				'_',
				'slider_animation_speed',
				'previous_keyframe',
				'next_keyframe',
				'play_animation',
			],
			default_place: true
		})
		Blockbench.onUpdateTo('3.8', () => {
			Toolbars.timeline.add(BarItems.timeline_graph_editor, 0);
		})
		//Tools
		Toolbars.main_tools = new Toolbar({
			id: 'main_tools',
			children: [
				'transform_space',
				'rotation_space',
				'lock_motion_trail'
			]
		})
		Blockbench.onUpdateTo('3.7', () => {
			Toolbars.main_tools.add(BarItems.lock_motion_trail, -1);
		})
		Toolbars.brush = new Toolbar({
			id: 'brush',
			children: [
				'fill_mode',
				'draw_shape_type',
				'_',
				'slider_brush_size',
				'slider_brush_opacity',
				'slider_brush_softness',
				'mirror_painting',
				'lock_alpha',
				'painting_grid',
			]
		})
		Toolbars.vertex_snap = new Toolbar({
			id: 'vertex_snap',
			children: [
				'vertex_snap_mode'
			]
		})

		//Mobile
		Toolbars.mobile_side = new Toolbar({
			id: 'mobile_side',
			children: [
				'sidebar_right',
				'sidebar_left',
				'action_control',
			],
			vertical: true,
			default_place: Blockbench.isMobile
		})

		Toolbox = Toolbars.tools;
		Toolbox.toggleTransforms = function() {
			if (Toolbox.selected.id === 'move_tool') {
				BarItems['resize_tool'].select()
			} else if (Toolbox.selected.id === 'resize_tool') {
				BarItems['move_tool'].select()
			}
		}
		BarItems.move_tool.select()

		BarItems.uv_dialog.toElement('#uv_title_bar')
		BarItems.uv_dialog_full.toElement('#uv_title_bar')
	},
	setupVue() {
		BARS.list = new Vue({
			el: '#toolbar_edit',
			data: {
				items: BarItems,
				currentBar: [],
				search_term: ''
			},
			computed: {
				searchedBarItems() {
					var name = this.search_term.toUpperCase()
					var list = [{
						icon: 'bookmark',
						name: tl('data.separator'),
						type: 'separator'
					}]
					for (var key in BarItems) {
						var item = BarItems[key]
						if (name.length == 0 ||
							item.name.toUpperCase().includes(name) ||
							item.id.toUpperCase().includes(name)
						) {
							if (
								!this.currentBar.includes(item)
							) {
								list.push(item)
							}
						}
					}
					return list;
				}
			},
			methods: {
				sort: function(event) {
					var item = this.currentBar.splice(event.oldIndex, 1)[0]
					this.currentBar.splice(event.newIndex, 0, item)
					this.update();
				},
				drop: function(event) {
					var scope = this;
					var index = event.oldIndex
					$('#bar_items_current .tooltip').css('display', '')
					setTimeout(() => {
						if ($('#bar_items_current:hover').length === 0) {
							var item = scope.currentBar.splice(event.oldIndex, 1)[0]
							item.toolbars.remove(BARS.editing_bar)
							scope.update()
						}
					}, 30)
				},
				choose: function(event) {
					$('#bar_items_current .tooltip').css('display', 'none')
				},
				update: function() {
					BARS.editing_bar.update().save();
				},
				addItem: function(item) {
					if (item.type === 'separator') {
						item = '_'
					}
					BARS.editing_bar.add(item);
					BARS.editing_bar.update().save();
				}
			}
		})

		ActionControl.vue = new Vue({
			el: '#action_selector',
			data: {
				open: false,
				search_input: '',
				index: 0,
				length: 0,
				list: []
			},
			computed: {
				actions: function() {
					var search_input = this._data.search_input.toUpperCase()
					var list = this._data.list.empty()
					for (var i = 0; i < Keybinds.actions.length; i++) {
						var item = Keybinds.actions[i];
						if (
							search_input.length == 0 ||
							item.name.toUpperCase().includes(search_input) ||
							item.id.toUpperCase().includes(search_input)
						) {
							if (item instanceof Action && BARS.condition(item.condition)) {
								list.push(item)
								if (list.length > ActionControl.max_length) i = Infinity;
							}
						}
					}
					this._data.length = list.length;
					if (this._data.index < 0) {
						this._data.index = 0;
					}
					if (this._data.index >= list.length) {
						this._data.index = list.length-1;
					}
					return list;
				}
			},
			template: `
				<dialog id="action_selector" v-if="open">
					<input type="text" v-model="search_input" @input="e => search_input = e.target.value" autocomplete="off" autosave="off" autocorrect="off" spellcheck="off" autocapitalize="off">
					<i class="material-icons" id="action_search_bar_icon">search</i>
					<div>
						<ul>
							<li v-for="(item, i) in actions"
								v-html="item.menu_node.innerHTML"
								:class="{selected: i === index}"
								@click="ActionControl.click(item, $event)"
								@mouseenter="index = i"
							></li>
						</ul>
						<div class="small_text" v-if="actions[index]">{{ Pressing.alt ? actions[index].keybind.label : actions[index].description }}</div>
					</div>
				</dialog>
			`
		})
	},
	updateConditions() {
		var open_input = document.querySelector('input[type="text"]:focus, input[type="number"]:focus, div[contenteditable="true"]:focus');
		for (var key in Toolbars) {
			if (Toolbars.hasOwnProperty(key) &&
				(!open_input || $(Toolbars[key].node).has(open_input).length === 0)
			) {
				Toolbars[key].update()
			}
		}
		uv_dialog.all_editors.forEach((editor) => {
			editor.updateInterface()
		})
	}
}
const ActionControl = {
	get open() {return ActionControl.vue._data.open},
	set open(state) {ActionControl.vue._data.open = !!state},
	type: 'action_selector',
	max_length: 32,
	select() {
		ActionControl.open = true;
		open_interface = ActionControl;
		ActionControl.vue._data.index = 0;
		Vue.nextTick(_ => {
			$('#action_selector > input').focus().select();
		})
	},
	hide() {
		open_interface = false;
		ActionControl.open = false;
	},
	confirm(e) {
		var data = ActionControl.vue._data
		var action = data.list[data.index]
		ActionControl.hide()
		if (action) {
			ActionControl.trigger(action, e)
		}
	},
	cancel() {
		ActionControl.hide()
	},
	trigger(action, e) {
		if (action.id == 'action_control') {
			$('body').effect('shake');
			Blockbench.showQuickMessage('Congratulations! You have discovered recursion!', 3000)
		}
		action.trigger(e)
	},
	click(action, e) {
		ActionControl.trigger(action, e)
		ActionControl.hide()
	},
	handleKeys(e) {
		var data = ActionControl.vue._data

		if (e.altKey) {
			ActionControl.vue.$forceUpdate()
		}

		if (e.which === 38) {
			data.index--;
			if (data.index < 0) {
				data.index = data.length-1;
			}
		} else if (e.which === 40) {
			data.index++;
			if (data.index >= data.length) {
				data.index = 0;
			}
		} else {
			return false;
		}
		return true;
	}
}

const Keybinds = {
	actions: [],
	stored: {},
	extra: {},
	structure: {
		search_results: {
			name: tl('dialog.settings.search_results'),
			hidden: true,
			open: true,
			actions: {}
		}
	},
	save() {
		localStorage.setItem('keybindings', JSON.stringify(Keybinds.stored))
	},
	reset() {
		let answer = confirm(tl('message.reset_keybindings'));
		if (!answer) return;
		for (var category in Keybinds.structure) {
			var entries = Keybinds.structure[category].actions
			if (entries && entries.length) {
				entries.forEach(function(item) {
					if (item.keybind) {
						if (item.default_keybind) {
							item.keybind.set(item.default_keybind);
						} else {
							item.keybind.clear();
						}
						item.keybind.save(false)
					}
				})
			}
		}
		Keybinds.save()
	}
}
if (localStorage.getItem('keybindings')) {
	try {
		Keybinds.stored = JSON.parse(localStorage.getItem('keybindings'))
	} catch (err) {}
}

